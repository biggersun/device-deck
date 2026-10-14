---
name: device-deck
description: Manage or inspect registered computers, NAS, routers, Android and iOS devices through DeviceDeck's private registry, connection plans and fixed read-only probes. Use for LAN, Tailscale, remote or USB device access; not for arbitrary unregistered servers.
---

# DeviceDeck

Use DeviceDeck as the shared inventory instead of copying endpoints or credential data into separate agent files. The user's private runtime data is outside this repository. Read [management](../../docs/management.md) for onboarding or credential changes and [agent setup](../../docs/agents.md) if the CLI or MCP is not connected.

## Workflow

1. List devices with `device_deck_list_devices` or `device-deck list`. Select a stable device ID and one explicit endpoint ID. Saved observations have timestamps; they do not prove current connectivity.
2. Read the device and its access method. Use `device_deck_connection_plan` or `device-deck plan DEVICE ENDPOINT` for SSH, Android pairing, iOS USB trust or existing WDA instructions. This returns a plan, not an executed login.
3. Use `device_deck_probe_device` or `device-deck probe DEVICE ENDPOINT` for a current fixed read-only check. A probe records a local observation; it does not change the remote device. Report identity verification separately from reachability. Missing metrics remain unknown.
4. For authorized registration changes, use the web app or `device-deck import /absolute/private/inventory.json`. Check the exact selected device after the update. Raw passwords, key content, pairing codes and tokens must stay in the existing client/vault, outside imports, tool responses and version control.

SSH requires trusted host keys. Password profiles need human terminal entry. Android checks require an already-authorized explicit ADB serial; iOS USB checks require an already-trusted explicit UDID. Existing WDA status does not prove enrolled device identity or grant UI-control permission. Missing clients or unavailable pairing are concrete limitations, not offline-device proof.

DeviceDeck v0.1 exposes no arbitrary remote command, restart, UI-action, automatic pairing or vault-secret retrieval tool. A task that needs those actions still requires the relevant native capability and the user's scope-specific authorization. Do not infer broader device-control permission from a successful probe.
