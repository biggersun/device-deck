# Changelog

Notable changes to DeviceDeck. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Redesigned local console with four pages: devices overview, device editor, access profiles with connection plans, and activity & agent setup.
  - The devices overview has status tiles, search (`/` shortcut), a device → endpoint table, and a detail panel with resources and next steps for each failure.
  - The device editor is protocol-aware, with live pre-save checks and a command preview.
  - The UI is in Chinese and English, with light and dark themes and a responsive layout. It needs no build step and loads nothing from a CDN.
- Delete a device (together with its saved observations) or an unused access profile, from the web UI and the HTTP API.
- `device-deck export` and `GET /api/export`: re-importable registry JSON without observations or secrets.
- `GET /api/events` and `GET /api/info` (version, data directory, executable path for MCP setup, retention).
- Open-source project files: Chinese README, code of conduct, issue and pull request templates, Dependabot, and changelog.

### Changed
- Creating a device or access profile in the web UI never replaces an existing ID (HTTP 409); editing uses `PUT` on the existing ID. `device-deck import` keeps upsert semantics.
- The SSH probe runs in an explicit remote `/bin/sh -s` fed through stdin, so fish or csh login shells work. Client output is streamed and capped.
- `uv` rebuilds the non-editable install whenever `src/` changes (`[tool.uv] cache-keys`).

### Fixed
- The legacy UI read an empty device ID because endpoint inputs shared `name="id"`.
- An SSH probe could hang or buffer unbounded output from a misbehaving host.

## [0.1.0] - 2026-10-14

### Added
- First public version. It provides:
  - a shared SQLite registry of devices, endpoints, access-profile references, observations and audit events;
  - fixed read-only adapters for SSH, already-paired Android ADB, trusted iOS USB, and existing WebDriverAgent status;
  - a loopback web UI, CLI, local stdio MCP server and portable `SKILL.md`.

[Unreleased]: https://github.com/biggersun/device-deck/compare/5e23e52...HEAD
[0.1.0]: https://github.com/biggersun/device-deck/commit/5e23e52
