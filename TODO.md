# v0.1 scope and acceptance

- [x] Specify identity, endpoint, credential reference, observation and audit models.
- [x] Implement private shared SQLite registry and typed validation.
- [x] Implement SSH, already-paired Android ADB, trusted iOS USB and existing WDA status adapters.
- [x] Implement local web UI, CLI, Skill and MCP contracts.
- [x] Validate model, transport, HTTP origin and MCP behavior with automated tests.
- [x] Import the owner's device inventory privately and validate existing SSH endpoints.
- [x] Inspect the local web UI and native agent discovery/MCP calls.
- [x] Prepare public code, fictional examples and documentation; sensitive-data staging scan passed.

Limits: real phone acceptance, automated password vault access, discovery reconciliation, remote multi-user serving and device actions are not part of v0.1. Local personal inventory and runtime evidence never enter this public project.

# Next

- [ ] Real-phone acceptance for Android ADB (USB and wireless) and iOS USB/WDA.
- [ ] Disk reporting: include ZFS and network filesystems where meaningful, and de-duplicate bind mounts.
- [ ] macOS: estimate *available* memory (free + reclaimable cache) instead of leaving it unknown.
- [ ] Localize connection-plan steps and audit summaries returned by the server (the UI is bilingual; these are English).
- [ ] Publish tagged releases to PyPI so `uvx device-deck` works without a Git URL.
- [ ] Optional scheduled checks with a visible staleness indicator (still read-only, still explicit endpoints).
