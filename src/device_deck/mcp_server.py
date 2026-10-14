import asyncio
import json
from typing import Literal, Any

from mcp.server import MCPServer

from .service import Hub


def create_server(home=None):
    hub = Hub(home)
    server = MCPServer("device_deck_mcp")
    read = {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False}

    def render(value, response_format):
        if response_format == "markdown":
            return {"markdown": "```json\n"+json.dumps(value, ensure_ascii=False, indent=2)+"\n```"}
        return value

    @server.tool(annotations=read)
    def device_deck_list_devices(limit: int = 50, offset: int = 0,
                                 response_format: Literal["json", "markdown"] = "json") -> dict[str, Any]:
        """List registered device identities, LAN/remote/USB endpoints, credential references and timestamped observations. Does not probe devices or retrieve secrets. Limit 1..100, offset >= 0."""
        return render(hub.store.list_devices(limit, offset), response_format)

    @server.tool(annotations=read)
    def device_deck_get_device(device_id: str, response_format: Literal["json", "markdown"] = "json") -> dict[str, Any]:
        """Read one device and its connection/credential metadata and saved observations. A saved status is historical, not proof the device is currently online."""
        return render(hub.store.device_view(hub.store.get_device(device_id)), response_format)

    @server.tool(annotations=read)
    def device_deck_connection_plan(device_id: str, endpoint_id: str,
                                    response_format: Literal["json", "markdown"] = "json") -> dict[str, Any]:
        """Return a connection command and human pairing/login prerequisites for one registered endpoint. Does not execute the command, retrieve a password, pair a phone or modify network settings."""
        return render(hub.plan(device_id, endpoint_id), response_format)

    @server.tool(annotations={"readOnlyHint": False, "destructiveHint": False,
                              "idempotentHint": False, "openWorldHint": True})
    async def device_deck_probe_device(device_id: str, endpoint_id: str,
                                      response_format: Literal["json", "markdown"] = "json") -> dict[str, Any]:
        """Run a fixed read-only probe against one registered SSH, paired ADB, trusted iOS USB or existing WDA endpoint. Saves a local observation and audit event. Never executes arbitrary shell/UI commands or performs pairing. Missing fields remain unknown."""
        return render(await asyncio.to_thread(hub.probe, device_id, endpoint_id, "mcp"), response_format)

    @server.resource("device-deck://devices")
    def inventory_resource() -> str:
        return json.dumps(hub.store.list_devices(), ensure_ascii=False)

    return server
