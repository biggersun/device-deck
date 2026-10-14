# Contributing

Open an issue describing the device protocol and a reproducible, redacted problem. Discuss model or action-scope changes before implementation. Provide protocol fixtures and identity/failure tests; distinguish mocked mobile coverage from actual hardware acceptance. Maintain English quickstart docs and update the Chinese plan when architecture or scope changes.

Run `uv sync --extra dev --no-editable` and `uv run --no-editable pytest`. Keep changes focused. Do not add cloud telemetry, arbitrary command execution, automatic pairing, secret retrieval or network exposure without an explicit design and acceptance criteria. Include no real credentials or private device data in issues or pull requests.
