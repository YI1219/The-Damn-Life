#!/usr/bin/env python3
"""Minimal agent-native CLI: stdin message, stdout JSON with --json (CLI-Anything–style pattern)."""

from __future__ import annotations

import argparse
import json
import sys


def main() -> None:
    parser = argparse.ArgumentParser(description="Echo a note; use stdin for the message body.")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON on stdout")
    _args = parser.parse_args()

    message = sys.stdin.read().strip()
    if not message:
        print("empty stdin message", file=sys.stderr)
        sys.exit(1)

    result = {"echoed": message, "length": len(message)}
    if _args.json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(message)


if __name__ == "__main__":
    main()
