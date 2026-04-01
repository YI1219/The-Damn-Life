# CLI-Anything pattern (integration guide)

[CLI-Anything](https://github.com/HKUDS/CLI-Anything) generates **structured, agent-ready CLIs** (often with `--json` and self-describing help). This repo does **not** embed its generator pipeline; we **mirror the contract** so Skills stay small and testable.

## Contract

1. **Input**: Prefer **stdin**, **flags**, or a **single file path** — avoid shell-joined strings for untrusted text.
2. **Output**: With `--json`, print **one JSON object** per invocation on stdout; errors on stderr; non-zero exit on failure.
3. **Manifest**: Keep a `manifest.json` next to the entry script (`skills/<name>/manifest.json`) describing permissions and input shape.

## Reference Skill: `cli-note-echo`

- Entry: [skills/cli-note-echo/handler.py](../skills/cli-note-echo/handler.py)
- Host runner: [host/src/cliNoteEchoSkill.ts](../host/src/cliNoteEchoSkill.ts) (`python3` + stdin)

## Adding a new CLI-backed Skill

1. Generate or hand-write a CLI that supports `--json` (CLI-Anything can bootstrap this from a codebase).
2. Add `skills/<skill-name>/` with `manifest.json` + handler.
3. Extend `TaskPlanV1` in [host/src/taskPlan.ts](../host/src/taskPlan.ts) and [host/schemas/task-plan-v1.json](../host/schemas/task-plan-v1.json) if the payload shape is new.
4. In [host/src/server.ts](../host/src/server.ts), dispatch in `executeTask` after approval, following the file-organizer / note-echo patterns.
5. Teach the **rule planner** or **Ollama planner** how to emit the new `taskType`.

## Why not npm-depend on CLI-Anything?

The generator is Python-heavy and pulls a large dev graph. Keeping generation **out of the runtime** matches the “thin kernel” goal in `project_plan_v1_1.md`.
