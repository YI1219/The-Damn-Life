"""Dev-oriented HTTP shim: POST one wire envelope JSON, respond with NDJSON emits from TaskRuntime."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
from urllib.parse import urlparse

from src.runtime_core import TaskRuntime


def handle_envelope(msg: dict[str, Any]) -> list[dict[str, Any]]:
    """Run one message through TaskRuntime; return all emitted wire dicts (order preserved)."""
    out: list[dict[str, Any]] = []

    def emit(m: dict[str, Any]) -> None:
        out.append(m)

    TaskRuntime(emit=emit).handle_message(msg)
    return out


class _BridgeHandler(BaseHTTPRequestHandler):
    server_version = "TDL-RuntimeBridge/0.1"

    def log_message(self, _format: str, *_args: Any) -> None:
        return

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/handle":
            self.send_error(404)
            return
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/handle":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            msg = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_response(400)
            self._cors()
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"invalid json body")
            return
        if not isinstance(msg, dict):
            self.send_response(400)
            self._cors()
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"body must be a JSON object")
            return

        outs = handle_envelope(msg)
        body = "".join(f"{json.dumps(line, ensure_ascii=False)}\n" for line in outs).encode("utf-8")
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    host = os.environ.get("RUNTIME_BRIDGE_HOST", "127.0.0.1")
    port = int(os.environ.get("RUNTIME_BRIDGE_PORT", "9876"))
    httpd = HTTPServer((host, port), _BridgeHandler)
    print(
        f"# runtime-py bridge listening on http://{host}:{port}/handle (POST wire envelope JSON)",
        file=sys.stderr,
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("# shutting down", file=sys.stderr)


if __name__ == "__main__":
    main()
