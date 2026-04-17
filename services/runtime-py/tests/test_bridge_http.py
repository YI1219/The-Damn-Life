import uuid

from src.bridge_http import handle_envelope
from src.wire import CONTRACT_VERSION


def test_handle_envelope_task_submit_emits_contract_messages():
    trace = str(uuid.uuid4())
    msg = {
        "contractVersion": CONTRACT_VERSION,
        "timestamp": "2026-04-15T00:00:00.000Z",
        "traceId": trace,
        "sessionId": "sess-1",
        "type": "task.submit",
        "payload": {"intent": "hello", "clientTaskRef": "ref-x"},
    }
    outs = handle_envelope(msg)
    types = [o["type"] for o in outs]
    assert "audit.record" in types
    assert "task.accepted" in types
    assert "task.started" in types
    assert "task.completed" in types
    assert types[-1] == "audit.record"
