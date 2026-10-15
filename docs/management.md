# Management workflow

## Enroll

1. Choose a stable device ID independent of IP addresses, operating systems and access protocol.
2. Register an authentication profile: external SSH key path, SSH agent, manual password reference, ADB pairing, trusted iOS USB or existing WDA access. Do not paste a secret into a reference field.
3. Add endpoints to that device. LAN and Tailscale SSH share device identity and may use the same verified `host_key_alias`. USB uses serial/UDID, not a fabricated IP.
4. Use the connection plan. Perform host-key enrollment, password entry, pairing and iPhone trust in your trusted native tools. DeviceDeck does not perform these steps.
5. Probe an explicitly selected endpoint. SSH hostname and account must match registered identity; strict OpenSSH host-key checks remain enabled. An unregistered expected hostname is reachable but unverified.

## Daily use

Read timestamps before using saved status. Select an endpoint for the current network. The app never silently switches from one route to another or upgrades an unreachable result into an online claim. ADB selection is bound to one serial; trusted iOS USB to one UDID. WDA status by itself does not prove the enrolled device identity.

## Changes and credentials

Edit a device in place when an address changes. Changing a reusable credential profile is rejected if it conflicts with any referenced endpoint protocol. Rotate secrets with your existing OS/SSH/vault tools; update the reference and check again. Password profiles support registration and manual connection instructions, not automatic secret retrieval.

## Audit, retention and recovery

Registry imports/upserts, deletions and probes append local audit summaries with `cli`, `web` or `mcp` actor labels. These are interface labels, not authenticated human identity. Keep the newest 50 observations per endpoint and 1,000 probe-maintained audit events. Local metadata is private and unencrypted. Back up the private data directory while the app is stopped; never commit its files or personal exports to a public repository.

In the web UI, adding a device or access profile never replaces an existing ID (HTTP 409); editing uses `PUT` on the existing ID. `device-deck import` keeps upsert semantics for bulk changes.

Deleting a device also removes its saved observations; its access profiles and key files are untouched. An access profile cannot be deleted while any endpoint uses it (HTTP 409 lists the users). `device-deck export` or **Export inventory JSON** on the Activity page produces a re-importable registry without observations; it contains no secrets because none are stored. For a full copy including observations, back up the SQLite file (for example `sqlite3 inventory.sqlite ".backup copy.sqlite"`). Archival, migration tooling and automatic encrypted backups are not yet provided.

## Mobile connection prerequisites

| Protocol | Required setup | v0.1 check |
|---|---|---|
| Android USB ADB | Android Platform Tools, USB debugging, unlock and approve this computer | Explicit authorized serial, Android version, memory and `/data` filesystem |
| Android wireless ADB | Supported wireless debugging and interactive pairing; connection port can change | Already-connected serial only; no pairing or port opening |
| iOS USB | libimobiledevice, cable, unlock and Trust this computer | Explicit connected UDID, device name, product type and version |
| iOS WDA | Existing signed WebDriverAgent setup; trust/developer requirements for your OS | Fixed `/status`; memory and disks unknown; identity unverified |

Sources: [Android ADB](https://developer.android.com/tools/adb), [libimobiledevice](https://github.com/libimobiledevice/libimobiledevice), [WebDriverAgent](https://github.com/appium/WebDriverAgent). Do not expose wireless ADB or WDA directly to the public Internet.
