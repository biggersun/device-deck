import asyncio
import json

from fastapi.testclient import TestClient
from mcp import Client
import pytest

from device_deck.models import Inventory
from device_deck.mcp_server import create_server
from device_deck.store import Store
from device_deck.web import create_app
from device_deck import adapters
from test_core import fixture_inventory


def test_http_rejects_cross_origin_bad_host_and_secret_echo(tmp_path):
    client = TestClient(create_app(tmp_path), base_url="http://127.0.0.1")
    assert client.get("/api/devices", headers={"origin": "https://other.example"}).status_code == 403
    assert client.get("/api/devices", headers={"host": "other.example"}).status_code == 400
    assert client.post("/api/credentials", json={}).status_code == 403
    payload = {"id": "bad", "name": "Bad", "method": "password", "password": "private-input-value"}
    response = client.post("/api/credentials", json=payload, headers={"origin": "http://127.0.0.1"})
    assert response.status_code == 422
    assert "private-input-value" not in response.text


def test_browser_enroll_and_read_shared_registry(tmp_path):
    client = TestClient(create_app(tmp_path), base_url="http://127.0.0.1")
    inventory = fixture_inventory().model_dump()
    origin = {"origin": "http://127.0.0.1"}
    assert client.post("/api/credentials", json=inventory["credentials"][0], headers=origin).status_code == 200
    assert client.post("/api/devices", json=inventory["devices"][0], headers=origin).status_code == 200
    assert Store(tmp_path).get_device("fixture").name == "Fixture server"
    assert client.get("/api/devices").json()["total_count"] == 1
    assert client.get("/").headers["content-security-policy"].startswith("default-src 'self'")
    assert client.get("/assets/unknown").status_code == 404


def test_browser_add_never_replaces_existing_device(tmp_path):
    client = TestClient(create_app(tmp_path), base_url="http://127.0.0.1")
    inventory = fixture_inventory().model_dump()
    origin = {"origin": "http://127.0.0.1"}
    client.post("/api/credentials", json=inventory["credentials"][0], headers=origin)
    device = inventory["devices"][0]
    assert client.post("/api/devices", json=device, headers=origin).status_code == 200
    clash = dict(device, name="Other box")
    assert client.post("/api/devices", json=clash, headers=origin).status_code == 409
    assert client.post("/api/credentials", json=inventory["credentials"][0], headers=origin).status_code == 409
    assert Store(tmp_path).get_device("fixture").name == "Fixture server"
    assert client.put("/api/devices/fixture", json=clash, headers=origin).status_code == 200
    assert Store(tmp_path).get_device("fixture").name == "Other box"
    assert client.put("/api/devices/other", json=clash, headers=origin).status_code == 400
    assert client.put("/api/devices/missing", json=dict(clash, id="missing"), headers=origin).status_code == 404
    assert client.put("/api/devices/fixture", json=clash).status_code == 403


def test_mcp_tools_and_shared_plan_without_remote_execution(tmp_path):
    Store(tmp_path).import_inventory(fixture_inventory("password"))
    async def exercise():
        async with Client(create_server(tmp_path)) as client:
            tools = await client.list_tools()
            assert {t.name for t in tools.tools} == {"device_deck_list_devices", "device_deck_get_device", "device_deck_connection_plan", "device_deck_probe_device"}
            result = await client.call_tool("device_deck_list_devices", {"limit": 1})
            assert result.structured_content["total_count"] == 1
            result = await client.call_tool("device_deck_connection_plan", {"device_id": "fixture", "endpoint_id": "lan"})
            assert result.structured_content["auth_method"] == "password"
            result = await client.call_tool("device_deck_probe_device", {"device_id": "fixture", "endpoint_id": "lan"})
            assert result.structured_content["status"] == "interactive_required"
            invalid = await client.call_tool("device_deck_list_devices", {"limit": 101})
            assert invalid.is_error
    asyncio.run(exercise())


def test_android_targets_one_paired_serial(monkeypatch):
    calls = []
    def fake(args, **kwargs):
        calls.append(args)
        if args[-1] == "get-state": return "device\n"
        if "ro.product.model" in args: return "Fixture phone\n"
        if "ro.build.version.release" in args: return "16\n"
        if "/proc/meminfo" in args: return "MemTotal: 8000000 kB\nMemAvailable: 5000000 kB\n"
        return "Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/data 1000000 400000 600000 40% /data\n"
    monkeypatch.setattr(adapters, "run", fake)
    from device_deck.models import Device, Credential
    device = Device.model_validate({"id": "phone", "name": "Phone", "kind": "android", "endpoints": [{"id": "usb", "network": "usb", "protocol": "adb", "serial": "FIXTURE_SERIAL", "credential_id": "pair"}]})
    result, verified = adapters.probe_adb(device, device.endpoints[0], Credential(id="pair", name="Pair", method="adb_pairing"))
    assert verified and result["system"]["version"] == "16"
    assert all(a[:3] == ["adb", "-s", "FIXTURE_SERIAL"] for a in calls)
    assert all("pair" not in a and "connect" not in a for a in calls)


def test_ios_usb_only_selected_trusted_udid(monkeypatch):
    from device_deck.models import Device, Credential
    calls=[]
    def fake(args, **kwargs):
        calls.append(args)
        if args[0] == "idevice_id": return "FIXTURE_UDID\n"
        return {"ProductVersion": "19.0", "DeviceName": "Fixture iPhone", "ProductType": "FixtureModel"}[args[-1]]
    monkeypatch.setattr(adapters, "run", fake)
    device=Device.model_validate({"id": "iphone", "name": "iPhone", "kind": "ios", "endpoints": [{"id": "usb", "network": "usb", "protocol": "ios_usb", "serial": "FIXTURE_UDID", "credential_id": "trust"}]})
    result, verified=adapters.probe_ios_usb(device,device.endpoints[0],Credential(id="trust",name="Trust",method="ios_trust"))
    assert verified and result["memory"] is None and result["disks"] is None
    assert all(a[1:3] == ["-u", "FIXTURE_UDID"] for a in calls if a[0] == "ideviceinfo")


def test_wda_status_never_claims_identity_or_unavailable_metrics(monkeypatch):
    from io import BytesIO
    from device_deck.models import Device, Credential
    class Reply(BytesIO):
        def __enter__(self): return self
        def __exit__(self, *args): self.close()
    class Opener:
        def open(self, url, timeout):
            assert url == "http://192.0.2.30:8100/status"
            return Reply(b'{"value":{"os":{"name":"iOS","version":"19.0"}}}')
    monkeypatch.setattr(adapters.urllib.request, "build_opener", lambda *a: Opener())
    device=Device.model_validate({"id":"iphone","name":"iPhone","kind":"ios","endpoints":[{"id":"wda","protocol":"wda","host":"192.0.2.30","port":8100,"credential_id":"wda"}]})
    result,verified=adapters.probe_wda(device,device.endpoints[0],Credential(id="wda",name="WDA",method="wda_access"))
    assert not verified and result["memory"] is None and result["disks"] is None


def test_alias_mismatch_stops_before_connection(tmp_path,monkeypatch):
    from device_deck.service import Hub
    hub=Hub(tmp_path)
    payload=fixture_inventory().model_dump()
    payload["devices"][0]["endpoints"][0]["ssh_alias"]="fixture-alias"
    hub.store.import_inventory(Inventory.model_validate(payload))
    calls=[]
    def fake(args,**kwargs):
        calls.append(args)
        return "hostname 198.51.100.99\nuser operator\nport 22\n"
    monkeypatch.setattr(adapters,"run",fake)
    result=hub.probe("fixture","lan")
    assert result["status"] == "configuration_mismatch" and len(calls)==1


def test_delete_export_and_info(tmp_path):
    client = TestClient(create_app(tmp_path), base_url="http://127.0.0.1")
    origin = {"origin": "http://127.0.0.1"}
    Store(tmp_path).import_inventory(fixture_inventory())
    exported = client.get("/api/export").json()
    assert Inventory.model_validate(exported).devices[0].id == "fixture"
    assert "observation" not in json.dumps(exported)
    info = client.get("/api/info").json()
    assert info["data_dir"] == str(tmp_path.resolve()) and info["retention"]["observations_per_endpoint"] == 50
    assert info["data_dir_short"] == info["data_dir"] or info["data_dir_short"].startswith("~/")
    assert client.delete("/api/credentials/key", headers=origin).status_code == 409
    assert client.delete("/api/devices/fixture").status_code == 403
    assert client.delete("/api/devices/fixture", headers=origin).status_code == 200
    assert client.delete("/api/devices/fixture", headers=origin).status_code == 404
    assert client.delete("/api/credentials/key", headers=origin).status_code == 200
    assert client.get("/api/events?limit=5").json()[0]["action"] == "credential_delete"
    assert client.get("/api/events?limit=500").status_code == 400


def test_cli_export_round_trips_the_example_inventory(tmp_path, monkeypatch, capsys):
    from pathlib import Path
    import sys
    from device_deck import cli
    example = Path(__file__).parent.parent / "examples" / "inventory.json"
    for argv in (["import", str(example)], ["export"]):
        monkeypatch.setattr(sys, "argv", ["device-deck", "--home", str(tmp_path / "a"), *argv])
        capsys.readouterr()
        cli.main()
    exported = json.loads(capsys.readouterr().out)
    original = Inventory.model_validate_json(example.read_text(encoding="utf-8"))
    by_id = lambda records: sorted(records, key=lambda r: r.id)
    assert by_id(Inventory.model_validate(exported).devices) == by_id(original.devices)
    assert by_id(Inventory.model_validate(exported).credentials) == by_id(original.credentials)
    Store(tmp_path / "b").import_inventory(Inventory.model_validate(exported), mode="create")
    assert Store(tmp_path / "b").export_inventory() == exported
