## What and why

<!-- One or two sentences. Link the issue if there is one. -->

## How it was checked

- [ ] `uv run --no-editable pytest`
- [ ] `node --check src/device_deck/static/app.js` (if the UI changed)
- [ ] UI changes checked in light and dark, Chinese and English, and at phone width
- [ ] New protocol behavior has fixtures for success **and** failure/identity cases

## Safety

- [ ] No real addresses, serials, usernames, keys, passwords, databases or screenshots with real data
- [ ] No new secret storage, secret retrieval, arbitrary command execution, automatic pairing or network exposure
- [ ] Docs and `CHANGELOG.md` updated if behavior changed
