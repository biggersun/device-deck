import json
from pathlib import Path
import subprocess

import pytest
from pydantic import ValidationError

from device_deck import adapters
from device_deck.models import Credential, Device, Inventory
from device_deck.service import Hub
from device_deck.store import Store


def fixture_inventory(method="ssh_key"):
    credential = {"id": "key", "name": "Fixture profile", "method": method}
    if method == "ssh_key":
        credential["key_path"] = "~/.ssh/fixture_key"
    return Inventory.model_validate({"credentials": [credential], "devices": [{
        "id": "fixture", "name": "Fixture server", "kind": "server", "expected_hostname": "fixture-server",
        "endpoints": [{"id": "lan", "host": "192.0.2.10", "username": "operator", "credential_id": "key"}]}]})


@pytest.mark.parametrize("field", ["password", "private_key", "token", "pairing_code"])
def test_secret_fields_rejected(field):
    with pytest.raises(ValidationError):
        Credential.model_validate({"id": "manual", "name": "Manual", "method": "password", field: "private-input-value"})


@pytest.mark.parametrize("host", ["-oProxyCommand=bad", "host;touch-file", "http://example.com", "host\nextra"])
def test_host_cannot_be_option_or_shell_fragment(host):
    payload = fixture_inventory().model_dump()
    payload["devices"][0]["endpoints"][0]["host"] = host
    with pytest.raises(ValidationError):
        Inventory.model_validate(payload)


def test_private_reference_is_not_a_password():
    with pytest.raises(ValidationError):
        Credential(id="manual", name="Manual", method="password", vault_ref="a-plain-secret")


def test_unknown_reference_rolls_back_entire_import(tmp_path):
    store = Store(tmp_path)
    payload = fixture_inventory().model_dump()
    payload["devices"][0]["endpoints"][0]["credential_id"] = "missing"
    with pytest.raises(ValueError):
        store.import_inventory(Inventory.model_validate(payload))
    assert store.credentials() == []
    assert store.list_devices()["total_count"] == 0


def test_reused_credential_cannot_break_existing_device(tmp_path):
    store = Store(tmp_path)
    store.import_inventory(fixture_inventory())
    with pytest.raises(ValueError):
        store.import_inventory(Inventory(credentials=[Credential(id="key", name="Changed", method="adb_pairing")]))
    assert store.get_credential("key").method == "ssh_key"


def test_one_identity_has_multiple_routes_and_real_pagination(tmp_path):
    store = Store(tmp_path)
    payload = fixture_inventory().model_dump()
    second = dict(payload["devices"][0]["endpoints"][0], id="tailscale", host="100.64.0.10", network="tailscale")
    payload["devices"][0]["endpoints"].append(second)
    store.import_inventory(Inventory.model_validate(payload))
    assert store.list_devices()["total_count"] == 1
    assert len(store.list_devices()["items"][0]["endpoints"]) == 2
    store.import_inventory(Inventory(devices=[Device(id="second", name="Second", kind="server", endpoints=fixture_inventory().devices[0].endpoints)]))
    page = store.list_devices(limit=1)
    assert page["has_more"] and page["next_offset"] == 1
    assert len(store.list_devices(limit=1, offset=1)["items"]) == 1


def test_password_probe_does_not_attempt_ssh(tmp_path, monkeypatch):
    hub = Hub(tmp_path)
    hub.store.import_inventory(fixture_inventory("password"))
    monkeypatch.setattr(adapters, "run", lambda *a, **k: pytest.fail("Must not invoke SSH for password profile"))
    result = hub.probe("fixture", "lan")
    assert result["status"] == "interactive_required" and not result["reachable"]
    assert hub.plan("fixture", "lan")["auth_method"] == "password"


LINUX_SAMPLE = '''__DD_ID__
fixture-server
operator
Linux
6.1.0
__DD_VERSION__
PRETTY_NAME="Debian GNU/Linux 12"
VERSION_ID="12"
OS_VERSION=1.2.3
__DD_MEMORY__
MemTotal: 16000000 kB
MemAvailable: 10000000 kB
MemFree: 2000000 kB
Cached: 8000000 kB
SwapTotal: 2000000 kB
SwapFree: 1500000 kB
__DD_DISK__
Filesystem 1024-blocks Used Available Capacity Mounted on
overlay 20000000 2000000 18000000 10% /
/dev/data 4000000000 3000000000 1000000000 75% /volume1
/dev/loop0 1000 1000 0 100% /system/image
tmpfs 1000000 1 999999 1% /tmp
__DD_SWAP__
Filename Type Size Used Priority
/dev/disk-swap partition 1000000 0 1
/dev/zram0 partition 1000000 500000 10
__DD_MOUNTS__
/ overlay rw,relatime
/volume1 ext4 rw,relatime
__DD_END__
'''


def test_linux_metrics_distinguish_cache_swap_and_images():
    data = adapters.parse_ssh(LINUX_SAMPLE)
    assert data["system"]["firmware"] == "1.2.3"
    assert data["memory"]["used_bytes"] == 6000000*1024
    assert data["memory"]["swap_devices"][0]["used_bytes"] == 0
    assert data["memory"]["swap_devices"][1]["kind"] == "zram"
    assert [d["mount"] for d in data["disks"]] == ["/", "/volume1"]
    assert data["disks"][1]["filesystem_type"] == "ext4"


def test_read_only_root_image_is_identified():
    text = LINUX_SAMPLE.replace("/ overlay rw,relatime", "/ squashfs ro,relatime")
    assert adapters.parse_ssh(text)["disks"][0]["read_only"] is True


def test_missing_memory_stays_unknown():
    data = adapters.parse_linux_memory("MemTotal: 1234 kB")
    assert data["available_bytes"] is None and data["used_bytes"] is None
    assert data["swap_used_bytes"] is None and data["cache_bytes"] is None


def test_hostname_mismatch_is_not_saved_as_verified(tmp_path, monkeypatch):
    hub = Hub(tmp_path)
    hub.store.import_inventory(fixture_inventory())
    monkeypatch.setattr(adapters, "run", lambda *a, **k: LINUX_SAMPLE.replace("fixture-server", "wrong-server"))
    result = hub.probe("fixture", "lan")
    assert result["status"] == "identity_mismatch" and not result["identity_verified"]


def test_ssh_is_strict_and_no_user_supplied_command():
    inventory = fixture_inventory()
    args = adapters.ssh_args(inventory.devices[0].endpoints[0], inventory.credentials[0])
    assert "StrictHostKeyChecking=yes" in args and "BatchMode=yes" in args
    assert args[-1] == "operator@192.0.2.10" and "-i" in args


def test_ssh_failure_does_not_echo_raw_stderr(monkeypatch):
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: subprocess.CompletedProcess(a, 255, "", "Permission denied. private-input-value"))
    with pytest.raises(adapters.ProbeFailure) as error:
        adapters.run(["ssh"])
    assert error.value.status == "authentication_failed"
    assert "private-input-value" not in error.value.detail


def test_observation_retention_and_db_permissions(tmp_path):
    store = Store(tmp_path)
    for i in range(55):
        store.save_observation({"device_id": "fixture", "endpoint_id": "lan", "checked_at": str(i), "status": "timeout"})
    with store.connect() as db:
        assert db.execute("SELECT count(*) FROM observations").fetchone()[0] == 50
    assert store.latest("fixture", "lan")["checked_at"] == "54"
    assert store.path.stat().st_mode & 0o777 == 0o600


def test_public_example_validates_without_personal_devices():
    example = Path(__file__).parents[1] / "examples/inventory.json"
    Inventory.model_validate_json(example.read_text())
