# v0.1 verification record

Date: 2026-10-14. Local Python 3.13, official MCP SDK 2.3.0. CI exercises Python 3.11 and 3.13 with `uv.lock`.

- Automated cases cover strict schema/host validation, secret field rejection, atomic credential references, pagination, retention, account/hostname mismatch, alias drift, HTTP Host/Origin protections, typed MCP discovery/calls, mobile serial binding, iOS unknown metrics, WDA unverified identity and read-only filesystem handling.
- Standard installed package, actual stdio subprocess, tool discovery, registry reads, connection plan and saved observations were checked without model inference.
- Real OpenSSH checks on enrolled macOS and Linux/BusyBox devices returned matching identities and system/memory/filesystem observations. All personal addresses and device records were kept outside the repository.
- Browser acceptance covered inventory display, search, access-profile references, per-endpoint instructions, a successful live status refresh and edit-form population. Local native agent skill discovery and MCP configuration readback succeeded.

Limits: Android ADB, iOS USB and WDA have protocol fixture coverage only, not real-phone acceptance. Password login metadata and manual plans are implemented; automatic password vault use is not. No Internet exposure, automatic pairing, device action or multi-user authentication was tested or provided. Stored timestamps describe observations, not future availability.

2026-10-14 follow-up: web create/update split (no silent overwrite), streamed and capped client output, stdin-fed `/bin/sh -s` probe, FreeBSD parsing fixtures and a stale-install guard. The SSH change was rechecked against the enrolled macOS, Linux NAS and BusyBox router devices; FreeBSD has fixture coverage only.

2026-10-15 console redesign: the four-page UI (overview, editor, access profiles with connection plans, activity and agent setup) was checked in a browser against a fictional inventory with synthetic observations. Checks covered light and dark themes, Chinese and English, 1440px and 375px widths, ID-conflict and required-field checks, protocol switching, create/edit/delete for devices and access profiles, refusal to delete a profile that is in use, probes, connection plans, export, the `/` search shortcut and the absence of page-level horizontal scroll. README screenshots come from that fictional data.
