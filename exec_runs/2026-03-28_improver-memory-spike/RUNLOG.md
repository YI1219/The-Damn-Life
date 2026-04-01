# Run: 2026-03-28 — improver + memory retrieval choice

## Goals

- Ship developer-only improver (worktree + Planner / Implementer / Critic + OpenAI-compatible API).
- Gate loop: `npm run build` + `host gate:lite` via root `check:gate-lite`.
- Memory spike decision: **ripgrep** over `docs/`, `project_plan/`, `project_target/` (see `tools/improver/src/retrieve.ts`).

## Why not cognee (for now)

- Keeps the default repo graph small and avoids a long-lived embedding service in the monorepo.
- `rg` + fixed doc roots matches V1.1 “optional memory” guidance; cognee can be revisited if retrieval quality blocks real goals.

## Files touched

- `docs/improver_scope.md`
- `tools/improver/**`
- Root `package.json` (workspace + `improver` + `check:gate-lite`)
- `host/package.json` (`gate:lite`)
- `.gitignore` (`.worktrees/`)

## Verification (local)

```bash
npm install
npm run build
npm run check:gate-lite
```

Improver end-to-end requires API keys and spend; not run in CI here.

## Follow-ups

- Optional: `response_format` fallback for APIs without `json_object` mode.
- Optional: cognee sidecar spike with measured ROI vs `rg`.
