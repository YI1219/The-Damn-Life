"""Wire message helpers aligned with packages/event-contracts (keep CONTRACT_VERSION in sync)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable

# Mirror packages/event-contracts/src/version.ts — bump together.
CONTRACT_VERSION = "0.1.0"

EmitFn = Callable[[dict[str, Any]], None]


def utc_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def envelope(
    *,
    msg_type: str,
    payload: dict[str, Any],
    trace_id: str,
    correlation_id: str | None = None,
    session_id: str | None = None,
    workspace_id: str | None = None,
) -> dict[str, Any]:
    msg: dict[str, Any] = {
        "contractVersion": CONTRACT_VERSION,
        "timestamp": utc_iso_timestamp(),
        "traceId": trace_id,
        "type": msg_type,
        "payload": payload,
    }
    if correlation_id is not None:
        msg["correlationId"] = correlation_id
    if session_id is not None:
        msg["sessionId"] = session_id
    if workspace_id is not None:
        msg["workspaceId"] = workspace_id
    return msg
