from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3

from .models import Credential, Device, Inventory


def now():
    return datetime.now(timezone.utc).isoformat()


def default_home():
    return Path(os.environ.get("DEVICE_DECK_HOME", "~/.local/share/device-deck")).expanduser().resolve()


class Store:
    def __init__(self, home=None):
        self.home = Path(home).expanduser().resolve() if home else default_home()
        self.home.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.home.chmod(0o700)
        self.path = self.home / "inventory.sqlite"
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS credentials(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS observations(id INTEGER PRIMARY KEY, device_id TEXT,
                    endpoint_id TEXT, checked_at TEXT, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, at TEXT, actor TEXT,
                    action TEXT, subject TEXT, summary TEXT);
                CREATE INDEX IF NOT EXISTS observation_latest ON observations(device_id,endpoint_id,id DESC);
            """)
        self.path.chmod(0o600)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def _event(self, db, actor, action, subject, summary):
        db.execute("INSERT INTO events(at,actor,action,subject,summary) VALUES(?,?,?,?,?)",
                   (now(), actor, action, subject, summary))

    def import_inventory(self, inventory: Inventory, actor="cli"):
        with self.connect() as db:
            known = {r[0] for r in db.execute("SELECT id FROM credentials")}
            methods = {r[0]: json.loads(r[1])["method"] for r in db.execute("SELECT id,payload FROM credentials")}
            for credential in inventory.credentials:
                known.add(credential.id)
                methods[credential.id] = credential.method
            device_map = {r[0]: Device.model_validate_json(r[1]) for r in db.execute("SELECT id,payload FROM devices")}
            device_map.update({device.id: device for device in inventory.devices})
            for device in device_map.values():
                for endpoint in device.endpoints:
                    if endpoint.credential_id not in known:
                        raise ValueError("Unknown credential reference: " + endpoint.credential_id)
                    allowed = {"ssh": {"ssh_key", "ssh_agent", "password"}, "adb": {"adb_pairing"},
                               "ios_usb": {"ios_trust"}, "wda": {"wda_access"}}
                    if methods[endpoint.credential_id] not in allowed[endpoint.protocol]:
                        raise ValueError("Credential method does not match endpoint protocol")
            for credential in inventory.credentials:
                db.execute("INSERT INTO credentials VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
                           (credential.id, credential.model_dump_json()))
            for device in inventory.devices:
                db.execute("INSERT INTO devices VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
                           (device.id, device.model_dump_json()))
            self._event(db, actor, "inventory_upsert", "inventory",
                        f"{len(inventory.devices)} devices; {len(inventory.credentials)} credential references")
        return {"devices": len(inventory.devices), "credentials": len(inventory.credentials)}

    def get_device(self, device_id):
        with self.connect() as db:
            row = db.execute("SELECT payload FROM devices WHERE id=?", (device_id,)).fetchone()
        if not row:
            raise KeyError("Device not found")
        return Device.model_validate_json(row[0])

    def get_credential(self, credential_id):
        with self.connect() as db:
            row = db.execute("SELECT payload FROM credentials WHERE id=?", (credential_id,)).fetchone()
        if not row:
            raise KeyError("Credential reference not found")
        return Credential.model_validate_json(row[0])

    def credentials(self):
        with self.connect() as db:
            return [json.loads(r[0]) for r in db.execute("SELECT payload FROM credentials ORDER BY id")]

    def latest(self, device_id, endpoint_id):
        with self.connect() as db:
            row = db.execute("SELECT payload FROM observations WHERE device_id=? AND endpoint_id=? ORDER BY id DESC LIMIT 1",
                             (device_id, endpoint_id)).fetchone()
        return json.loads(row[0]) if row else None

    def device_view(self, device):
        result = device.model_dump()
        for endpoint in result["endpoints"]:
            endpoint["credential"] = self.get_credential(endpoint["credential_id"]).model_dump()
            endpoint["observation"] = self.latest(device.id, endpoint["id"])
        return result

    def list_devices(self, limit=50, offset=0):
        if not 1 <= limit <= 100 or offset < 0:
            raise ValueError("limit must be 1..100 and offset >= 0")
        with self.connect() as db:
            total = db.execute("SELECT count(*) FROM devices").fetchone()[0]
            rows = db.execute("SELECT payload FROM devices ORDER BY id LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return {"items": [self.device_view(Device.model_validate_json(r[0])) for r in rows], "total_count": total,
                "has_more": offset+len(rows) < total, "next_offset": offset+len(rows) if offset+len(rows) < total else None}

    def save_observation(self, result, actor="cli"):
        with self.connect() as db:
            db.execute("INSERT INTO observations(device_id,endpoint_id,checked_at,payload) VALUES(?,?,?,?)",
                       (result["device_id"], result["endpoint_id"], result["checked_at"], json.dumps(result)))
            self._event(db, actor, "probe", result["device_id"]+":"+result["endpoint_id"], result["status"])
            db.execute("DELETE FROM observations WHERE device_id=? AND endpoint_id=? AND id NOT IN "
                       "(SELECT id FROM observations WHERE device_id=? AND endpoint_id=? ORDER BY id DESC LIMIT 50)",
                       (result["device_id"], result["endpoint_id"], result["device_id"], result["endpoint_id"]))
            db.execute("DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY id DESC LIMIT 1000)")

    def events(self, limit=30):
        if not 1 <= limit <= 100:
            raise ValueError("limit must be 1..100")
        with self.connect() as db:
            return [dict(r) for r in db.execute("SELECT at,actor,action,subject,summary FROM events ORDER BY id DESC LIMIT ?", (limit,))]
