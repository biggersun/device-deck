# Contributing

Open an issue describing the device protocol and a reproducible, redacted problem. Discuss model or action-scope changes before implementation. Provide protocol fixtures and identity/failure tests; distinguish mocked mobile coverage from actual hardware acceptance. Maintain English quickstart docs and update the Chinese plan when architecture or scope changes.

Run `uv sync --extra dev --no-editable` and `uv run --no-editable pytest`. Keep changes focused. Do not add cloud telemetry, arbitrary command execution, automatic pairing, secret retrieval or network exposure without an explicit design and acceptance criteria. Include no real credentials or private device data in issues or pull requests.

## Development notes

- **Web UI**: plain HTML, CSS and JavaScript in `src/device_deck/static/`, with no build step and no dependencies. The CSP forbids inline scripts and styles, so build DOM nodes with the `h()` helper and set dynamic sizes through `element.style`. Every user-visible string needs both `zh` and `en` entries in `STRINGS`. Check light and dark themes, both languages, and a 375px width. Run `node --check src/device_deck/static/app.js`.
- **Screenshots and examples** must use fictional data: addresses from `192.0.2.0/24`, `198.51.100.0/24` or `100.64.0.0/10`, and obviously fake serials. Run a demo against a throwaway `--home` directory, never your real inventory.
- **Changelog**: add a line under *Unreleased* in `CHANGELOG.md` for any user-visible change.
- **Conduct**: this project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
