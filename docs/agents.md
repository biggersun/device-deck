# Skills and MCP for agents

All interfaces use the same private data directory. Setting `DEVICE_DECK_HOME` must point to your private inventory directory, never a public checkout. A local agent also needs access to its existing SSH keys, ADB pairings or iOS trusted computer context. Remote/cloud agents do not acquire those capabilities from a Markdown skill.

## Skill

Install one shared skill source for local Codex and Claude Code:

```bash
mkdir -p ~/.agents/skills ~/.claude/skills
ln -s /absolute/path/device-deck/skills/device-deck ~/.agents/skills/device-deck
ln -s /absolute/path/device-deck/skills/device-deck ~/.claude/skills/device-deck
```

Do not overwrite an existing skill of that name. Invoke `$device-deck` in Codex or `/device-deck` in Claude Code. Ordinary device requests can select the skill automatically. [Codex discovery](https://learn.chatgpt.com/docs/build-skills), [Claude skill discovery](https://code.claude.com/docs/en/skills).

## MCP stdio

Use the installed entry point or your checkout's `.venv/bin/device-deck`:

```json
{
  "mcpServers": {
    "device-deck": {
      "command": "/absolute/path/device-deck/.venv/bin/device-deck",
      "args": ["mcp"]
    }
  }
}
```

For Codex:

```toml
[mcp_servers.device-deck]
command = "/absolute/path/device-deck/.venv/bin/device-deck"
args = ["mcp"]
```

Use your client's native MCP registration command rather than replacing its existing configuration. Paths are installation-specific; existing MCP connections, permissions and environment must be preserved. Restart/reconnect a client if it does not reload new MCP configuration.

| Tool | Input | Output / side effect |
|---|---|---|
| `device_deck_list_devices` | limit 1..100, offset >=0, response_format | Paginated inventory; saved observations only |
| `device_deck_get_device` | device_id, response_format | Device, endpoints, authentication references, timestamps |
| `device_deck_connection_plan` | device_id, endpoint_id, response_format | Suggested command and human setup prerequisites; executes nothing |
| `device_deck_probe_device` | device_id, endpoint_id, response_format | Fixed read-only remote probe; saves local observation/audit |

Responses support JSON and Markdown. The resource `device-deck://devices` exposes the first inventory page. There are no secret-retrieval or arbitrary-command tools. Probe annotations describe local writes as well as remote access; annotations are not authorization controls.

Example requests: “List my registered devices and their LAN/remote addresses”; “Show how to connect to this Android USB endpoint”; “Check the NAS memory and disks through its LAN endpoint”. For offline or pairing-dependent endpoints, return the actual failure and required human step.

Source: [official MCP Python SDK](https://py.sdk.modelcontextprotocol.io/).
