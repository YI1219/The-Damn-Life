import json

from src.main import main
from src.runtime_core import TaskRuntime
from src.wire import CONTRACT_VERSION


def test_main_emits_ndjson(capsys):
    import sys

    old_argv = sys.argv
    try:
        sys.argv = ["runtime-py", "cli", "intent"]
        main()
    finally:
        sys.argv = old_argv
    captured = capsys.readouterr()
    lines = [ln for ln in captured.out.strip().split("\n") if ln.strip()]
    assert len(lines) >= 5
    first = json.loads(lines[0])
    assert first["contractVersion"] == CONTRACT_VERSION
    assert first["type"] == "audit.record"
    assert "# emitted" in captured.err


def test_task_submit_happy_path():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    trace = "trace-1"
    rt.submit_task(intent="do thing", trace_id=trace, client_task_ref="ref-a")
    types = [e["type"] for e in events]
    assert types[0] == "audit.record"
    assert "task.accepted" in types
    assert "task.started" in types
    assert types.count("task.progress") == 3
    assert "skill.invoked" in types
    assert "skill.completed" in types
    assert types[-2] == "task.completed"  # last is audit for completed
    assert events[-1]["type"] == "audit.record"
    completed = next(e for e in events if e["type"] == "task.completed")
    assert completed["traceId"] == trace
    assert "resultSummary" in completed["payload"]


def test_handle_task_submit_message():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    rt.handle_message(
        {
            "type": "task.submit",
            "traceId": "t-2",
            "payload": {"intent": "via wire", "clientTaskRef": "c1"},
        }
    )
    assert any(e["type"] == "task.completed" for e in events)


def test_unknown_message_emits_system_error():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    rt.handle_message({"type": "nope.unknown", "traceId": "t-3"})
    assert len(events) == 1
    assert events[0]["type"] == "system.error"
    assert events[0]["payload"]["code"] == "runtime.unhandled_type"


def test_unknown_skill_emits_task_failed():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    rt.submit_task(intent="x", trace_id="t-4", skill_id="missing.skill")
    assert any(e["type"] == "task.failed" for e in events)
    failed = next(e for e in events if e["type"] == "task.failed")
    assert failed["payload"]["code"] == "skill.unknown"
