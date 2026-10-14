# Security

DeviceDeck v0.1 is an early, local single-user application, not a hardened multi-user or Internet-facing service. The UI binds only to 127.0.0.1 and checks Host/Origin/cross-site request metadata. MCP uses local stdio. Do not publish its port through a public proxy, subnet bind or tunnel.

The inventory stores authentication metadata and external references, not secrets. Password login is a human terminal flow. DeviceDeck never reads key file contents or retrieves vault secrets; the native SSH client may read its own configured key to authenticate. Raw validation input is omitted from errors. Private SQLite metadata is unencrypted and protected by directory/file permissions. The OS account, its environment and configured SSH clients are trusted boundaries.

Strict OpenSSH host-key checking stays enabled. The first host key must be enrolled with independently verified fingerprint information in a trusted native client. Phone trust and ADB pairing happen outside this service. WDA status can be reachable without identity verification. Fixed probes never install software, open debug ports, alter routes, reboot a device or execute user-supplied remote commands.

Do not commit runtime databases, real IP/serial inventories, screenshots containing private data, SSH private keys, pairing codes or token-bearing configuration. Public examples are fictional. Report suspected vulnerabilities privately through GitHub's security advisory mechanism where enabled; do not post credentials or exploit data in public issues. This project does not yet provide an authenticated security support SLA.
