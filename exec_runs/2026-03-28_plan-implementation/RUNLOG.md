# Run: 2026-03-28 — plan implementation (schema, planner, skills, gates)

## Goals

- Establish `exec_runs/` convention and document this batch.
- TaskPlan v1 JSON schema + validation; rule planner + optional Ollama planner.
- Lightpanda-based read-only page fetch skill (binary optional); license/distribution notes in `docs/lightpanda_spike.md`.
- CLI-Anything–style demo skill (`cli-note-echo`) + integration guide.
- Weekly gate: red-team checks + optional kernel metrics.

## Changes

- See git diff for full file list; primary areas: `host/src/`, `shared/src/contracts.ts`, `mobile/src/main.tsx`, `skills/cli-note-echo/`, `docs/`, `host/schemas/`, `exec_runs/`.

## Verification

Run from repo root (host must be up for smoke tests, or use CI flow):

```text
npm run build
HOST_WS=ws://localhost:9876/ws npm run smoke:e2e
HOST_WS=ws://localhost:9876/ws npm run smoke:e2e-success
HOST_WS=ws://localhost:9876/ws npm run check:gate
```

**Recorded results (2026-03-28):** build OK; smoke + gate all PASS (weekly gate, red team, kernel metrics ~0.05 MiB under 3 MiB cap).

**Note:** Existing rows in `host/data.sqlite` with pre-schema `payload_json` (no `schemaVersion`) will fail validation on execute; use a fresh DB or migrate payloads if needed.

## Follow-ups

- Point `LIGHTPANDA_PATH` at a nightly binary to exercise `fetch_page_text` locally.
- Enable `DAMN_LIFE_PLANNER=ollama` when Ollama is running for broader NL planning.
