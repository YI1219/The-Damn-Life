import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ModelClient } from "./modelClient.js";
import {
  parseCriticRound,
  parseImplementerRound,
  parsePlannerRound,
  type ImplementerRound
} from "./protocol.js";
import { retrieveWithRg } from "./retrieve.js";
import { createWorktree, getRepoRoot } from "./worktree.js";

const MAX_FILE = 96 * 1024;

function parseArgs(): { goal: string; noWorktree: boolean } {
  const argv = process.argv.slice(2);
  let goal = "";
  let noWorktree = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--goal") {
      goal = argv[i + 1] ?? "";
      i += 1;
    } else if (argv[i] === "--no-worktree") {
      noWorktree = true;
    }
  }
  if (!goal.trim()) {
    console.error('Usage: npm run improver -- --goal "requirement text" [--no-worktree]');
    process.exit(2);
  }
  return { goal: goal.trim(), noWorktree };
}

function safeResolvedPath(workRoot: string, rel: string): string | null {
  const r = rel.replace(/^\.\/+/, "").replace(/\\/g, "/");
  if (r.includes("..") || r.startsWith("/")) {
    return null;
  }
  const full = resolve(workRoot, r);
  const root = resolve(workRoot);
  if (full !== root && !full.startsWith(`${root}/`)) {
    return null;
  }
  return full;
}

function readSnippet(workRoot: string, rel: string): string {
  const p = safeResolvedPath(workRoot, rel);
  if (!p) {
    return "(invalid path)";
  }
  try {
    const buf = readFileSync(p, "utf8");
    return buf.length > MAX_FILE ? `${buf.slice(0, MAX_FILE)}\n…(truncated)` : buf;
  } catch {
    return "(missing or unreadable)";
  }
}

function applyEdits(workRoot: string, edits: ImplementerRound["edits"]): string[] {
  const changed: string[] = [];
  for (const e of edits) {
    const p = safeResolvedPath(workRoot, e.path);
    if (!p) {
      throw new Error(`unsafe or invalid path: ${e.path}`);
    }
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, e.content, "utf8");
    changed.push(e.path);
  }
  return changed;
}

function runVerify(workRoot: string): { ok: boolean; log: string } {
  const full = process.env.IMPROVER_FULL_GATE === "1";
  const script = full ? "check:gate" : "check:gate-lite";
  const r = spawnSync("npm", ["run", script], {
    cwd: workRoot,
    encoding: "utf8",
    shell: true,
    maxBuffer: 16 * 1024 * 1024
  });
  return { ok: r.status === 0, log: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

async function main(): Promise<void> {
  const { goal, noWorktree } = parseArgs();
  const client = new ModelClient();
  const outerRepo = getRepoRoot(process.cwd());
  let workRoot = outerRepo;
  if (!noWorktree) {
    const wt = createWorktree(outerRepo);
    workRoot = wt.path;
    console.log(`Worktree: ${workRoot}\nBranch: ${wt.branch}\n`);
  }

  const context = retrieveWithRg(workRoot, goal);
  const maxOuter = Number(process.env.IMPROVER_MAX_OUTER ?? 4);
  const maxInner = Number(process.env.IMPROVER_MAX_INNER ?? 3);
  let lastVerifyLog = "";

  for (let o = 0; o < maxOuter; o += 1) {
    const plannerSys = `You are Planner in a multi-agent code pipeline. Output JSON only with keys: schemaVersion=1, role="planner", summary, targetFiles (relative paths, max 12), steps. Prefer minimal files. Repository is TypeScript/Node monorepo.`;
    const plannerUser = `Goal:\n${goal}\n\nRetrieved doc snippets (may be empty):\n${context || "(none)"}\n\nPrevious verify output (may be empty):\n${lastVerifyLog.slice(-6000)}`;
    const pRaw = JSON.parse(
      await client.completeJson([
        { role: "system", content: plannerSys },
        { role: "user", content: plannerUser }
      ])
    );
    const plan = parsePlannerRound(pRaw);
    if (!plan) {
      throw new Error("invalid planner JSON");
    }
    console.log(`[planner] ${plan.summary}`);

    let criticApproved = false;
    for (let i = 0; i < maxInner; i += 1) {
      const filesPayload = plan.targetFiles.map((f) => `### ${f}\n${readSnippet(workRoot, f)}`).join("\n\n");
      const implSys = `You are Implementer. Output JSON only: schemaVersion=1, role="implementer", edits: array of {path, content} with FULL file content. Paths relative to repo root, forward slashes. Max 12 edits.`;
      const implUser = `Plan:\n${plan.summary}\nSteps:\n${plan.steps.join("\n")}\n\nFiles:\n${filesPayload}`;
      const iRaw = JSON.parse(
        await client.completeJson([
          { role: "system", content: implSys },
          { role: "user", content: implUser }
        ])
      );
      const impl = parseImplementerRound(iRaw);
      if (!impl || impl.edits.length === 0) {
        throw new Error("invalid implementer JSON");
      }
      const changed = applyEdits(workRoot, impl.edits);
      console.log(`[implementer] wrote ${changed.join(", ")}`);

      const critSys = `You are Critic. Output JSON only: schemaVersion=1, role="critic", verdict "approve"|"revise", issues string[], summary string. Check security, scope, and obvious bugs.`;
      const preview = changed
        .map((f) => {
          const p = safeResolvedPath(workRoot, f);
          const c = p ? readFileSync(p, "utf8").slice(0, 2500) : "";
          return `### ${f}\n${c}`;
        })
        .join("\n");
      const cRaw = JSON.parse(
        await client.completeJson([
          { role: "system", content: critSys },
          { role: "user", content: `Changed files preview:\n${preview}` }
        ])
      );
      const crit = parseCriticRound(cRaw);
      if (!crit) {
        throw new Error("invalid critic JSON");
      }
      console.log(`[critic] ${crit.verdict}: ${crit.summary}`);
      if (crit.verdict === "approve") {
        criticApproved = true;
        break;
      }
    }

    if (!criticApproved) {
      console.warn("[critic] never approved; proceeding to verify.");
    }

    const v = runVerify(workRoot);
    lastVerifyLog = v.log;
    if (v.ok) {
      console.log("\nimprover: VERIFY OK\nReview diff, run smoke+e2e+full gate before merging.\n");
      console.log(`cd "${workRoot}" && git status && git diff`);
      return;
    }
    console.log(`[verify] failed (outer ${o + 1}/${maxOuter})\n${v.log.slice(-4000)}`);
  }

  console.error("improver: exceeded outer rounds without passing verify");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
