import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const MAX_TOTAL_CHARS = 24_000;
const MAX_MATCH_LINES = 40;

/**
 * Lean retrieval: ripgrep over planning docs (no cognee). Requires `rg` on PATH.
 */
export function retrieveWithRg(repoRoot: string, goal: string): string {
  if (!existsSync(join(repoRoot, "docs"))) {
    return "";
  }

  const rgProbe = spawnSync("rg", ["--version"], { encoding: "utf8" });
  if (rgProbe.error || rgProbe.status !== 0) {
    return "(ripgrep not available; install `rg` for doc-grounded retrieval)";
  }

  const needle = goal.trim().slice(0, 120);
  if (!needle) {
    return "";
  }

  const dirs = ["docs", "project_plan", "project_target"].filter((d) => existsSync(join(repoRoot, d)));

  const chunks: string[] = [];
  for (const d of dirs) {
    const r = spawnSync(
      "rg",
      ["-n", "-S", "-m", String(MAX_MATCH_LINES), "--glob", "!**/node_modules/**", "--glob", "*.md", "-F", needle, d],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
    );
    if (r.stdout?.trim()) {
      chunks.push(`## ${d}\n${r.stdout.trim()}`);
    }
  }

  let out = chunks.join("\n\n");
  if (out.length > MAX_TOTAL_CHARS) {
    out = `${out.slice(0, MAX_TOTAL_CHARS)}\n…(truncated)`;
  }
  return out;
}
