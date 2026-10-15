"""Locate the packaged agent skill and link it into local agent skill directories.

Installation only ever creates or replaces symbolic links; it never deletes a real directory.
"""
from importlib.resources import files
from pathlib import Path

NAME = "device-deck"
# Claude Code reads ~/.claude/skills; Codex reads ~/.agents/skills.
TARGETS = {"claude": ".claude/skills", "codex": ".agents/skills"}


def source_dir():
    return Path(str(files("device_deck") / "skill"))


def _target(agent, home):
    return Path(home or Path.home()) / TARGETS[agent] / NAME


def _state(path, source):
    if path.is_symlink() and not path.exists():
        return "broken"
    if not path.exists():
        return "missing"
    if path.resolve() == source.resolve():
        return "linked"
    if (path / "SKILL.md").is_file():
        return "other"
    return "conflict"


def status(home=None):
    source = source_dir()
    return [{"agent": agent, "path": str(_target(agent, home)), "state": _state(_target(agent, home), source)}
            for agent in TARGETS]


def install(agents=None, replace=False, home=None):
    """Link the packaged skill for each agent.

    Missing targets and dangling links are (re)created. A link to another copy is replaced only
    with ``replace``; a real directory or file is always left alone and reported as a conflict.
    """
    source = source_dir()
    if not (source / "SKILL.md").is_file():
        raise OSError(f"Packaged skill not found at {source}")
    results = []
    for agent in agents or list(TARGETS):
        path = _target(agent, home)
        state = _state(path, source)
        action = "unchanged"
        if state in ("missing", "broken") or (state in ("other", "conflict") and replace and path.is_symlink()):
            path.parent.mkdir(parents=True, exist_ok=True)
            if path.is_symlink():
                path.unlink()
            path.symlink_to(source, target_is_directory=True)
            action, state = "linked", "linked"
        results.append({"agent": agent, "path": str(path), "state": state, "action": action})
    return results
