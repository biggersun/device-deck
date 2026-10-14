# DeviceDeck development

Read TODO.md and the corresponding design before changing models, APIs or adapters. Maintain one shared data model for web, CLI, Skills and MCP. Keep credentials outside the inventory and reject unsupported secret fields without echoing their values. No arbitrary command or automatic pairing endpoint is part of v0.1.

Use `uv sync --extra dev` and `uv run pytest`. Test protocol failures and identity boundaries, not just happy paths. Public fixtures use fictional hosts and identifiers. Never commit actual personal inventories, databases, private keys, phone pairings or screenshots with real metadata.
