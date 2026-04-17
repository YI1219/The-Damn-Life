"""Skill registry and invocation — hooks for future real skills."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


SkillFn = Callable[[dict[str, Any]], Any]


@dataclass
class SkillResult:
    ok: bool
    summary: str
    error_code: str | None = None
    error_message: str | None = None


class SkillRegistry:
    def __init__(self) -> None:
        self._skills: dict[str, SkillFn] = {}

    def register(self, skill_id: str, fn: SkillFn) -> None:
        self._skills[skill_id] = fn

    def invoke(self, skill_id: str, context: dict[str, Any]) -> SkillResult:
        fn = self._skills.get(skill_id)
        if fn is None:
            return SkillResult(
                ok=False,
                summary="",
                error_code="skill.unknown",
                error_message=f"Unknown skill: {skill_id}",
            )
        try:
            out = fn(context)
            summary = out if isinstance(out, str) else str(out)
            return SkillResult(ok=True, summary=summary)
        except Exception as exc:  # noqa: BLE001 — boundary for skill sandbox MVP
            return SkillResult(
                ok=False,
                summary="",
                error_code="skill.exception",
                error_message=str(exc),
            )


def _builtin_echo(ctx: dict[str, Any]) -> str:
    intent = str(ctx.get("intent", ""))
    return f"echo:{intent[:200]}"


def default_registry() -> SkillRegistry:
    reg = SkillRegistry()
    reg.register("builtin.echo", _builtin_echo)
    return reg
