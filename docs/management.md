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

Registry imports/upserts and probes append local audit summaries with `cli`, `web` or `mcp` actor labels. These are interface labels, not authenticated human identity. Keep the newest 50 observations per endpoint and 1,000 probe-maintained audit events. Local metadata is private and unencrypted. Back up the private data directory while the app is stopped; never commit its files or personal exports to a public repository.

v0.1 supports add/edit/upsert and local database backup. Archival, deletion UI, migration tooling and automatic encrypted backups are not yet provided.

## Mobile connection prerequisites

| Protocol | Required setup | v0.1 check |
|---|---|---|
| Android USB ADB | Android Platform Tools, USB debugging, unlock and approve this computer | Explicit authorized serial, Android version, memory and `/data` filesystem |
| Android wireless ADB | Supported wireless debugging and interactive pairing; connection port can change | Already-connected serial only; no pairing or port opening |
| iOS USB | libimobiledevice, cable, unlock and Trust this computer | Explicit connected UDID, device name, product type and version |
| iOS WDA | Existing signed WebDriverAgent setup; trust/developer requirements for your OS | Fixed `/status`; memory and disks unknown; identity unverified |

Sources: [Android ADB](https://developer.android.com/tools/adb), [libimobiledevice](https://github.com/libimobiledevice/libimobiledevice), [WebDriverAgent](https://github.com/appium/WebDriverAgent). Do not expose wireless ADB or WDA directly to the public Internet.
