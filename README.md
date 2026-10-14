# DeviceDeck

**One private device registry for you, your CLI, Skills, and MCP clients.**

Track a computer, NAS, router, Android phone or iPhone as one stable device with multiple LAN, Tailscale, remote or USB connection endpoints. Keep authentication methods and credential references visible without putting passwords or private keys into your inventory or agent responses.

Early **v0.1** personal-use MVP. Python 3.11+. The web app runs only on loopback; no device-side agent is required for SSH. Mobile checks require your existing, paired development tools. [中文方案](docs/plan.zh-CN.md) · [Management workflow](docs/management.md) · [Architecture](docs/architecture.md) · [Agent setup](docs/agents.md).

## Try it

```bash
git clone https://github.com/biggersun/device-deck.git
cd device-deck
uv sync --extra dev --no-editable
uv run --no-editable device-deck import examples/inventory.json
uv run --no-editable device-deck serve
```

Open **http://127.0.0.1:8765**. The example uses fictional addresses and no secrets. Edit or replace it with your own devices in the UI or import a private JSON file outside the repository.

Without `uv`: `python3 -m venv .venv`, activate the virtual environment, then `pip install -e '.[dev]'` and use `device-deck` directly.

## What works

- Shared SQLite inventory: devices, endpoints, reusable authentication profiles, timestamped observations and local audit events.
- Web UI: add/edit devices, add authentication references, inspect addresses, connection instructions and collected metrics.
- CLI: `list`, `get`, `credentials`, `import`, `plan`, `probe`, `events`, `serve`, `mcp`.
- SSH: fixed read-only macOS/Linux/BusyBox system, memory and filesystem probes (FreeBSD parsing has fixture coverage only); the probe runs in an explicit remote `/bin/sh`, so fish or csh login shells work; output is size-capped while it streams; strict host-key checks; existing aliases validated against the registered account/address.
- Android: read-only checks through an explicitly selected, already-authorized ADB serial. USB and wireless connection instructions.
- iOS: version/model through trusted USB with libimobiledevice, or status of an existing WDA service. Memory/disk values remain unknown where unavailable.
- Skill instructions and local stdio MCP: list, get, plan and probe.

Mobile adapters have fixture coverage; real phones must be tested in your own paired environment. No phone is automatically enrolled, paired, jailbroken or exposed to the network.

## Credentials and limits

Profiles support SSH key paths, SSH agent, password-login references, ADB pairing, iOS trust and WDA access. The password profile records **how** to log in and an optional external vault reference; automatic password retrieval/login is not implemented in v0.1. Passwords, key material and pairing codes are rejected by the schema. Host-key enrollment is manual.

Local data defaults to `~/.local/share/device-deck/inventory.sqlite` (outside this repo). Override with `DEVICE_DECK_HOME` or `device-deck --home /private/path`. Do not commit inventories, screenshots with real device data, databases or key files. File permissions protect other OS users; the database is **not encrypted** and its metadata is private. [Security](SECURITY.md).

Probes cannot execute arbitrary commands. Device controls, automatic pairing, credential vault integration, discovery reconciliation and authenticated remote multi-user serving are roadmap items, not shipped capabilities.

## CLI and MCP

```bash
uv run --no-editable device-deck list
uv run --no-editable device-deck plan workstation lan
uv run --no-editable device-deck probe workstation lan
uv run --no-editable device-deck mcp
```

MCP uses the official Python SDK, with no LLM API or model call required. See [agent configuration examples](docs/agents.md).

## Development

```bash
uv sync --extra dev --no-editable
uv run --no-editable pytest
```

The package is installed non-editable. `[tool.uv] cache-keys` in `pyproject.toml` makes `uv run`/`uv sync` rebuild it whenever `src/` changes; the MCP server and anything calling `.venv/bin/device-deck` directly keep the previous build until one of those commands runs, so run `uv sync --extra dev --no-editable` after pulling or editing and restart your MCP client.

MIT licensed. Contributions should preserve the distinction between registered facts, observed status, verified identity and unknown values. [Contributing](CONTRIBUTING.md).
