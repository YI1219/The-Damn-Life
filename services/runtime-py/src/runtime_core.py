"""MVP task loop: accept → plan (stub) → skills → audit/task events."""

from __future__ import annotations

import hashlib
import uuid
from typing import Any

from src.planning import plan_placeholder
from src.skills import SkillRegistry, default_registry
from src.wire import EmitFn, envelope


class TaskRuntime:
    """
    Orchestration surface for relay/host bridges. Emits contract-shaped dicts
    via ``emit`` (e.g. to WebSocket JSON or logs).
    """

    def __init__(
        self,
        *,
        emit: EmitFn | None = None,
        skills: SkillRegistry | None = None,
    ) -> None:
        self._emit = emit or (lambda _msg: None)
        self._skills = skills if skills is not None else default_registry()

    def handle_message(self, msg: dict[str, Any]) -> None:
        mtype = msg.get("type")
        if mtype == "task.submit":
            self._on_task_submit(msg)
            return
        self._emit(
            envelope(
                msg_type="system.error",
                payload={
                    "code": "runtime.unhandled_type",
                    "message": f"Unsupported message type: {mtype!r}",
                    "fatal": False,
                },
                trace_id=str(msg.get("traceId") or uuid.uuid4()),
                session_id=msg.get("sessionId"),
                workspace_id=msg.get("workspaceId"),
                correlation_id=msg.get("correlationId"),
            )
        )

    def submit_task(
        self,
        *,
        intent: str,
        trace_id: str,
        metadata: dict[str, Any] | None = None,
        client_task_ref: str | None = None,
        session_id: str | None = None,
        workspace_id: str | None = None,
        correlation_id: str | None = None,
        skill_id: str | None = None,
    ) -> str:
        """Run the in-process task loop; returns assigned task id."""
        task_id = str(uuid.uuid4())
        meta = dict(metadata or {})
        self._audit(
            task_id=task_id,
            trace_id=trace_id,
            session_id=session_id,
            workspace_id=workspace_id,
            correlation_id=correlation_id,
            action="task.received",
            outcome="success",
            detail={"intent_preview": intent[:128]},
        )
        self._emit(
            envelope(
                msg_type="task.accepted",
                payload={"taskId": task_id, "clientTaskRef": client_task_ref},
                trace_id=trace_id,
                session_id=session_id,
                workspace_id=workspace_id,
                correlation_id=correlation_id,
            )
        )
        self._emit(
            envelope(
                msg_type="task.started",
                payload={"taskId": task_id},
                trace_id=trace_id,
                session_id=session_id,
                workspace_id=workspace_id,
                correlation_id=correlation_id,
            )
        )
        try:
            steps = plan_placeholder(intent)
            total = len(steps)
            for i, step in enumerate(steps):
                self._emit(
                    envelope(
                        msg_type="task.progress",
                        payload={
                            "taskId": task_id,
                            "step": step,
                            "percent": int(round(100 * (i + 1) / total)),
                            "message": step,
                        },
                        trace_id=trace_id,
                        session_id=session_id,
                        workspace_id=workspace_id,
                        correlation_id=correlation_id,
                    )
                )
            chosen_skill = skill_id or str(meta.get("skillId") or "builtin.echo")
            digest = _args_digest(intent, meta)
            self._emit(
                envelope(
                    msg_type="skill.invoked",
                    payload={
                        "skillId": chosen_skill,
                        "taskId": task_id,
                        "argsDigest": digest,
                    },
                    trace_id=trace_id,
                    session_id=session_id,
                    workspace_id=workspace_id,
                    correlation_id=correlation_id,
                )
            )
            ctx = {"intent": intent, "metadata": meta, "taskId": task_id}
            result = self._skills.invoke(chosen_skill, ctx)
            if result.ok:
                self._emit(
                    envelope(
                        msg_type="skill.completed",
                        payload={"skillId": chosen_skill, "taskId": task_id},
                        trace_id=trace_id,
                        session_id=session_id,
                        workspace_id=workspace_id,
                        correlation_id=correlation_id,
                    )
                )
                summary = result.summary or "ok"
                self._emit(
                    envelope(
                        msg_type="task.completed",
                        payload={"taskId": task_id, "resultSummary": summary},
                        trace_id=trace_id,
                        session_id=session_id,
                        workspace_id=workspace_id,
                        correlation_id=correlation_id,
                    )
                )
                self._audit(
                    task_id=task_id,
                    trace_id=trace_id,
                    session_id=session_id,
                    workspace_id=workspace_id,
                    correlation_id=correlation_id,
                    action="task.completed",
                    outcome="success",
                    detail={"skillId": chosen_skill},
                )
            else:
                self._emit(
                    envelope(
                        msg_type="skill.failed",
                        payload={
                            "skillId": chosen_skill,
                            "taskId": task_id,
                            "code": result.error_code or "skill.failed",
                            "message": result.error_message or "Skill failed",
                        },
                        trace_id=trace_id,
                        session_id=session_id,
                        workspace_id=workspace_id,
                        correlation_id=correlation_id,
                    )
                )
                self._emit(
                    envelope(
                        msg_type="task.failed",
                        payload={
                            "taskId": task_id,
                            "code": result.error_code or "skill.failed",
                            "message": result.error_message or "Skill failed",
                            "retryable": False,
                        },
                        trace_id=trace_id,
                        session_id=session_id,
                        workspace_id=workspace_id,
                        correlation_id=correlation_id,
                    )
                )
                self._audit(
                    task_id=task_id,
                    trace_id=trace_id,
                    session_id=session_id,
                    workspace_id=workspace_id,
                    correlation_id=correlation_id,
                    action="task.failed",
                    outcome="failure",
                    detail={
                        "skillId": chosen_skill,
                        "code": result.error_code,
                    },
                )
        except Exception as exc:  # noqa: BLE001 — last-resort task boundary
            self._emit(
                envelope(
                    msg_type="task.failed",
                    payload={
                        "taskId": task_id,
                        "code": "runtime.internal",
                        "message": str(exc),
                        "retryable": False,
                    },
                    trace_id=trace_id,
                    session_id=session_id,
                    workspace_id=workspace_id,
                    correlation_id=correlation_id,
                )
            )
            self._audit(
                task_id=task_id,
                trace_id=trace_id,
                session_id=session_id,
                workspace_id=workspace_id,
                correlation_id=correlation_id,
                action="task.failed",
                outcome="failure",
                detail={"error": str(exc)},
            )
        return task_id

    def _on_task_submit(self, msg: dict[str, Any]) -> None:
        payload = msg.get("payload") or {}
        intent = str(payload.get("intent", ""))
        trace_id = str(msg.get("traceId") or uuid.uuid4())
        self.submit_task(
            intent=intent,
            trace_id=trace_id,
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None,
            client_task_ref=payload.get("clientTaskRef"),
            session_id=msg.get("sessionId"),
            workspace_id=msg.get("workspaceId"),
            correlation_id=msg.get("correlationId"),
            skill_id=None,
        )

    def _audit(
        self,
        *,
        task_id: str,
        trace_id: str,
        action: str,
        outcome: str,
        detail: dict[str, Any] | None,
        session_id: str | None,
        workspace_id: str | None,
        correlation_id: str | None,
    ) -> None:
        self._emit(
            envelope(
                msg_type="audit.record",
                payload={
                    "auditId": str(uuid.uuid4()),
                    "taskId": task_id,
                    "actor": {"kind": "runtime", "subject": "runtime-py"},
                    "action": action,
                    "outcome": outcome,
                    "detail": detail or {},
                },
                trace_id=trace_id,
                session_id=session_id,
                workspace_id=workspace_id,
                correlation_id=correlation_id,
            )
        )


def _args_digest(intent: str, metadata: dict[str, Any]) -> str:
    raw = f"{intent}\n{sorted(metadata.items())}".encode()
    return hashlib.sha256(raw).hexdigest()[:16]
