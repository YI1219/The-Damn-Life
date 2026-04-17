"""CLI entry — demo run; bridges should drive TaskRuntime.handle_message instead."""

from __future__ import annotations

import json
import sys
import uuid

from src.runtime_core import TaskRuntime


def main() -> None:
    trace = str(uuid.uuid4())
    out: list[dict] = []

    def emit(msg: dict) -> None:
        out.append(msg)
        line = json.dumps(msg, ensure_ascii=False)
        print(line, flush=True)

    runtime = TaskRuntime(emit=emit)
    intent = " ".join(sys.argv[1:]).strip() or "demo hello"
    runtime.submit_task(intent=intent, trace_id=trace)
    # stderr summary for humans when piping NDJSON
    print(f"# emitted {len(out)} messages, traceId={trace}", file=sys.stderr)


if __name__ == "__main__":
    main()
