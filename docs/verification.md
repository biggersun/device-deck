# v0.1 verification record

Date: 2026-10-14. Local Python 3.13, official MCP SDK 2.3.0. CI exercises Python 3.11 and 3.13 with `uv.lock`.

- 28 automated cases pass: strict schema/host validation, secret field rejection, atomic credential references, pagination, retention, account/hostname mismatch, alias drift, HTTP Host/Origin protections, typed MCP discovery/calls, mobile serial binding, iOS unknown metrics, WDA unverified identity and read-only filesystem handling.
- Standard installed package, actual stdio subprocess, tool discovery, registry reads, connection plan and saved observations were checked without model inference.
- Real OpenSSH checks on enrolled macOS and Linux/BusyBox devices returned matching identities and system/memory/filesystem observations. All personal addresses and device records were kept outside the repository.
- Browser acceptance covered inventory display, search, access-profile references, per-endpoint instructions, a successful live status refresh and edit-form population. Local native agent skill discovery and MCP configuration readback succeeded.

Limits: Android ADB, iOS USB and WDA have protocol fixture coverage only, not real-phone acceptance. Password login metadata and manual plans are implemented; automatic password vault use is not. No Internet exposure, automatic pairing, device action or multi-user authentication was tested or provided. Stored timestamps describe observations, not future availability.
