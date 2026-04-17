"""Placeholder planner — no hostname or placement; returns abstract step ids only."""


def plan_placeholder(intent: str) -> list[str]:
    """Deterministic stub plan until real planning lands."""
    stripped = intent.strip() or "(empty)"
    return [
        "plan.placeholder.parse_intent",
        "plan.placeholder.select_skills",
        f"plan.placeholder.execute:{stripped[:64]}",
    ]
