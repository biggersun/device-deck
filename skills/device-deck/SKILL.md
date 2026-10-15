---
name: device-deck
description: Answer questions about the user's own computers, NAS, routers, Android and iOS devices through DeviceDeck's private registry, connection plans and fixed read-only checks; also register or update those devices. Use for "is the NAS up", "how do I connect to the test phone", "check disk/memory", "add my devices", LAN/Tailscale/remote/USB access. Not for arbitrary unregistered servers.
---

# DeviceDeck

DeviceDeck is the user's private, local inventory of their devices, shared by the user, the `device-deck` CLI and the `device_deck_*` MCP tools. Use it instead of asking the user for addresses or copying them into agent memory files. The user normally never opens the web console; they just ask you.

Prefer the MCP tools. If they are not connected, use the CLI (`device-deck list`, `plan`, `probe`, …), which prints JSON. If neither exists, DeviceDeck is not installed: point the user to https://github.com/biggersun/device-deck.

## Answering questions

1. `device_deck_list_devices` (or `device-deck list`). Pick the device ID and one explicit endpoint ID that fits the user's current network (LAN at home, Tailscale or remote away, USB for a cabled phone). Never switch to another route silently; if the chosen one fails, say so and offer the other.
2. Saved observations are history with timestamps, not current status. For anything about "now" (is it up, how full is the disk, how much memory), run `device_deck_probe_device` (or `device-deck probe DEVICE ENDPOINT`). It is a fixed read-only check that records a local observation and audit event.
3. Report identity and reachability separately: `verified` means the hostname and account matched; `reachable_unverified` means something answered but identity is not confirmed. Metrics that are missing are unknown, never zero. Mention when the result was collected.
4. For "how do I connect", use `device_deck_connection_plan` (or `device-deck plan DEVICE ENDPOINT`). It returns a command and prerequisites and executes nothing.
5. On a failure, give the user the concrete next step: `host_key_untrusted` → they verify and accept the host key once with `ssh user@host`; `pairing_required` → unlock the phone and approve USB debugging; `interactive_required` → password login is a human terminal step; `dependency_missing` → install the named client (adb, libimobiledevice).

## Registering or updating devices

Registration goes through `device-deck import FILE`, an upsert of this JSON shape:

```json
{
  "credentials": [
    {"id": "nas-key", "name": "NAS SSH key", "method": "ssh_key", "key_path": "~/.ssh/id_ed25519"}
  ],
  "devices": [
    {"id": "nas", "name": "Home NAS", "kind": "nas", "expected_hostname": "nas",
     "endpoints": [
       {"id": "lan", "network": "lan", "protocol": "ssh", "host": "192.168.1.20", "port": 22, "username": "admin", "credential_id": "nas-key"},
       {"id": "tailscale", "network": "tailscale", "protocol": "ssh", "host": "100.64.0.20", "username": "admin", "credential_id": "nas-key", "host_key_alias": "192.168.1.20"}
     ]}
  ]
}
```

- IDs are lowercase `[a-z][a-z0-9_-]*` and stable: name the device, not its IP. `kind`: computer, nas, router, android, ios, server. `network`: lan, tailscale, remote, usb. `protocol`: ssh, adb (needs `serial`), ios_usb (needs `serial` = UDID, network usb), wda (needs `host`, port 8100).
- Credential `method`: ssh_key (with `key_path`), ssh_agent, password, adb_pairing, ios_trust, wda_access. A credential is a reference to how the user logs in. Never ask for, write or accept a password, private key content, pairing code or token; the schema rejects them anyway.
- `host_key_alias` lets a Tailscale endpoint reuse the host key the user already trusted for the LAN address.

Steps:

1. Run `device-deck list` and `device-deck credentials` first. Import is an upsert: reusing an existing ID replaces that record, so only do that when the user asked to change it.
2. Gather facts from the user and from local, non-secret hints such as `~/.ssh/config`, `adb devices -l` or `idevice_id -l`. Ask for anything you cannot see. Do not scan the network.
3. Show the user the JSON you intend to import and get their confirmation. Write it to a private temporary file, run `device-deck import`, then delete the file.
4. Probe each new endpoint. If the result is `reachable_unverified` because `expected_hostname` was unknown, show the user the hostname the probe observed, and after they confirm it is the right machine, set `expected_hostname` and import again. If it is `host_key_untrusted`, ask the user to connect once with `ssh` themselves and verify the fingerprint; never accept a host key for them or edit `known_hosts`.

The user can also add or edit devices in the web console (`device-deck serve`, then http://127.0.0.1:8765).

## Boundaries

DeviceDeck has no tool for arbitrary remote commands, restarts, UI actions, pairing or reading secrets from a vault. A successful probe does not grant permission to do anything else on the device; any further action needs the user's explicit, task-specific approval and the native tool for it. Never copy endpoint details or credentials from DeviceDeck into other files, prompts or repositories.
