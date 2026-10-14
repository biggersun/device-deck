import argparse
import json
from pathlib import Path
import sys
from pydantic import ValidationError

from .models import Inventory
from .service import Hub


def main():
    parser = argparse.ArgumentParser(prog="device-deck", description="Private device inventory and read-only connection probes")
    parser.add_argument("--home", help="Private data directory (default: DEVICE_DECK_HOME or ~/.local/share/device-deck)")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list")
    commands.add_parser("credentials")
    commands.add_parser("events")
    importer = commands.add_parser("import", help="Upsert an inventory JSON; never import passwords or key contents")
    importer.add_argument("file")
    for name in ["get", "plan", "probe"]:
        command = commands.add_parser(name)
        command.add_argument("device_id")
        if name != "get":
            command.add_argument("endpoint_id")
    commands.add_parser("mcp", help="Serve local stdio MCP; stdout is reserved for protocol messages")
    server = commands.add_parser("serve", help="Run the loopback-only local web application")
    server.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    try:
        if args.command == "mcp":
            from .mcp_server import create_server
            create_server(args.home).run()
            return
        if args.command == "serve":
            import uvicorn
            from .web import create_app
            uvicorn.run(create_app(args.home), host="127.0.0.1", port=args.port)
            return
        hub = Hub(args.home)
        if args.command == "list":
            result = hub.store.list_devices()
        elif args.command == "credentials":
            result = hub.store.credentials()
        elif args.command == "events":
            result = hub.store.events()
        elif args.command == "import":
            inventory = Inventory.model_validate_json(Path(args.file).expanduser().read_text(encoding="utf-8"))
            result = hub.store.import_inventory(inventory)
        elif args.command == "get":
            result = hub.store.device_view(hub.store.get_device(args.device_id))
        elif args.command == "plan":
            result = hub.plan(args.device_id, args.endpoint_id)
        else:
            result = hub.probe(args.device_id, args.endpoint_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if args.command == "probe" and result["status"] != "verified":
            sys.exit(2)
    except ValidationError as error:
        print(json.dumps({"error": "Invalid registration data; secret fields are not accepted",
                          "fields": [list(e["loc"]) for e in error.errors(include_input=False)]}), file=sys.stderr)
        sys.exit(1)
    except (KeyError, ValueError, OSError) as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
