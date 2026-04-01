# Improver subsystem scope (developer-only)

## Purpose

Optional tooling under `tools/improver/` that uses an **external OpenAI-compatible API** to propose code changes in a **Git worktree**, then runs **automated verification** before a human merges. It is **not** part of the consumer mobile assistant path in [docs/mvp_scope_v0_5.md](mvp_scope_v0_5.md).

## Threat model

- The model sees repository contents you send in prompts (file bodies, `rg` snippets). Treat **secrets** (API keys, `.env`, tokens) as exposed if they live in tracked paths.
- **Prompt injection** via docs or data files can steer edits; mitigation is **human review of diffs**, **worktree isolation** (no direct writes to `main`), and **automated build/gate** before merge.
- Network calls go to the configured API base URL only; do not point untrusted proxies at production keys.

## Rules

1. **Never** configure the improver to commit or push to `main` automatically. All machine edits stay on `ai/exp-*` branches inside a dedicated worktree.
2. **Merge** is a human action after reviewing `git diff` and passing full checks (including [docs/weekly_demo_gate.md](weekly_demo_gate.md) when a host is available for smoke tests).
3. **Default verification** in the loop uses `npm run build` plus a **lite gate** (`gate:lite`: red-team checks + dist size). Full `npm run check:gate` still depends on smoke artifacts; run smoke manually before release merges.

## Enabling

Set:

- `DAMN_LIFE_CHAT_API_BASE` — e.g. `https://api.openai.com` or `https://api.openai.com/v1` (trailing slashes stripped; `/v1` optional).
- `DAMN_LIFE_CHAT_API_KEY` — provider secret.
- `DAMN_LIFE_CHAT_MODEL` — model id.

Optional: `IMPROVER_MAX_OUTER`, `IMPROVER_MAX_INNER` for iteration limits.

Run from the repository root (requires `git`, `npm`, `rg` recommended):

```bash
export DAMN_LIFE_CHAT_API_BASE=https://api.openai.com
export DAMN_LIFE_CHAT_API_KEY=...
export DAMN_LIFE_CHAT_MODEL=gpt-4o-mini
npm run improver -- --goal "Your improvement request tied to docs"
```

This creates `.worktrees/ai-exp-*` with branch `ai/exp-<timestamp>`. Use `--no-worktree` only if you accept in-place edits on your current checkout.

## Memory / retrieval

The default retriever uses **`rg` (ripgrep)** on `docs/`, `project_plan/`, and `project_target/` to ground the planner. This avoids pulling **cognee** or other heavy RAG stacks into the repo; a future spike can swap the retriever if justified.

## Exec runs

Each improver development batch should log under `exec_runs/YYYY-MM-DD_improver-<topic>/RUNLOG.md` per [exec_runs/README.md](exec_runs/README.md).
