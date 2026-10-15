# Skills and MCP for agents

All interfaces use the same private data directory. Setting `DEVICE_DECK_HOME` must point to your private inventory directory, never a public checkout. A local agent also needs access to its existing SSH keys, ADB pairings or iOS trusted computer context. Remote/cloud agents do not acquire those capabilities from a Markdown skill.

The quickest setup is the agent prompt in the [README](../README.md#install-paste-this-to-your-agent). This page describes the pieces it installs.

## Skill

The skill ships inside the package (source: [`skills/device-deck/SKILL.md`](../skills/device-deck/SKILL.md)). Link it for local Claude Code (`~/.claude/skills`) and Codex (`~/.agents/skills`):

```bash
device-deck skill install          # both agents; --agent claude|codex to pick one
device-deck skill status           # linked, other (another copy), missing, broken or conflict
device-deck skill path             # where the packaged skill lives
```

Installation only creates symbolic links. A dangling link (for example after a Python upgrade moved the tool) is recreated. A link to another copy, such as a git checkout, is left in place unless you pass `--replace`. A real directory or file with the same name is never touched and is reported as a conflict.

Invoke `$device-deck` in Codex or `/device-deck` in Claude Code, or just ask about a device; the skill is selected automatically. [Codex discovery](https://learn.chatgpt.com/docs/build-skills), [Claude skill discovery](https://code.claude.com/docs/en/skills).

## MCP stdio

Register the installed entry point with each client's own command. `--scope user` makes it available in every Claude Code project rather than only the current one:

```bash
claude mcp add --scope user device-deck -- "$(command -v device-deck)" mcp
codex mcp add device-deck -- "$(command -v device-deck)" mcp
```

Codex can also be configured in `~/.codex/config.toml`:

```toml
[mcp_servers.device-deck]
command = "/absolute/path/to/device-deck"
args = ["mcp"]
```

Add `"--home", "/path"` before `"mcp"` if your inventory is not in the default directory. Use your client's native registration rather than replacing its configuration; existing MCP connections, permissions and environment must be preserved. Each agent session starts its own `device-deck mcp` process and stops it when the session ends; start a new session after installing or upgrading.

| Tool | Input | Output / side effect |
|---|---|---|
| `device_deck_list_devices` | limit 1..100, offset >=0, response_format | Paginated inventory; saved observations only |
| `device_deck_get_device` | device_id, response_format | Device, endpoints, authentication references, timestamps |
| `device_deck_connection_plan` | device_id, endpoint_id, response_format | Suggested command and human setup prerequisites; executes nothing |
| `device_deck_probe_device` | device_id, endpoint_id, response_format | Fixed read-only remote probe; saves local observation/audit |

Responses support JSON and Markdown. The resource `device-deck://devices` exposes the first inventory page. There are no secret-retrieval or arbitrary-command tools. Probe annotations describe local writes as well as remote access; annotations are not authorization controls.

Example requests: “List my registered devices and their LAN/remote addresses”; “Show how to connect to this Android USB endpoint”; “Check the NAS memory and disks through its LAN endpoint”. For offline or pairing-dependent endpoints, return the actual failure and required human step.

Source: [official MCP Python SDK](https://py.sdk.modelcontextprotocol.io/).
