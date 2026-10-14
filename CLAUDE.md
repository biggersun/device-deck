# Project guidance

Read TODO.md for current scope, docs/architecture.md before model/API/transport changes, and docs/management.md for access workflows. Core service, store and adapters are shared by web, CLI and MCP. Keep private inventories, actual device identifiers, passwords, key material, pairing data and runtime screenshots out of source control.

Run `uv sync --extra dev --no-editable` and `uv run --no-editable pytest`. Validate affected behavior before broadening tests. Preserve strict host-key checks, explicit mobile device selection, unknown metric values and the difference between intended inventory and observed status. SDK APIs follow the locked official MCP Python v2 line.
