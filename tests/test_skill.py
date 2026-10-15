import json
import re

from fastapi.testclient import TestClient

from device_deck import skill
from device_deck.models import Inventory
from device_deck.web import create_app


def test_skill_is_packaged_and_its_example_registers():
    text = (skill.source_dir() / "SKILL.md").read_text(encoding="utf-8")
    assert text.startswith("---\nname: device-deck\n")
    example = re.search(r"```json\n(.*?)```", text, re.S).group(1)
    Inventory.model_validate(json.loads(example))


def test_skill_install_only_creates_or_replaces_links(tmp_path):
    assert {s["state"] for s in skill.status(tmp_path)} == {"missing"}
    first = skill.install(home=tmp_path)
    assert [(r["agent"], r["action"], r["state"]) for r in first] == [("claude", "linked", "linked"), ("codex", "linked", "linked")]
    claude = tmp_path / ".claude/skills/device-deck"
    assert claude.is_symlink() and claude.resolve() == skill.source_dir().resolve()
    assert {r["action"] for r in skill.install(home=tmp_path)} == {"unchanged"}

    claude.unlink()
    claude.symlink_to(tmp_path / "gone")
    assert skill.status(tmp_path)[0]["state"] == "broken"
    assert skill.install(["claude"], home=tmp_path)[0]["state"] == "linked"

    other = tmp_path / "checkout"
    other.mkdir()
    (other / "SKILL.md").write_text("---\nname: device-deck\n---\n")
    claude.unlink()
    claude.symlink_to(other)
    assert skill.install(["claude"], home=tmp_path)[0] == {"agent": "claude", "path": str(claude), "state": "other", "action": "unchanged"}
    assert skill.install(["claude"], replace=True, home=tmp_path)[0]["action"] == "linked"

    codex = tmp_path / ".agents/skills/device-deck"
    codex.unlink()
    codex.mkdir()
    (codex / "notes.txt").write_text("user data")
    result = skill.install(["codex"], replace=True, home=tmp_path)[0]
    assert result["state"] == "conflict" and result["action"] == "unchanged"
    assert (codex / "notes.txt").read_text() == "user data" and not codex.is_symlink()


def test_info_reports_skill_status(tmp_path):
    info = TestClient(create_app(tmp_path), base_url="http://127.0.0.1").get("/api/info").json()
    assert [s["agent"] for s in info["skill"]] == ["claude", "codex"]
    assert all(s["path"].endswith("/skills/device-deck") for s in info["skill"])
