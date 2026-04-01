import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function getRepoRoot(cwd: string): string {
  return execSync("git rev-parse --show-toplevel", { cwd, encoding: "utf8" }).trim();
}

export function createWorktree(repoRoot: string): { branch: string; path: string } {
  const branch = `ai/exp-${Date.now()}`;
  const dirName = branch.replace(/\//g, "-");
  const wtRoot = join(repoRoot, ".worktrees");
  mkdirSync(wtRoot, { recursive: true });
  const wtPath = join(wtRoot, dirName);
  if (existsSync(wtPath)) {
    throw new Error(`worktree path already exists: ${wtPath}`);
  }
  const r = spawnSync("git", ["worktree", "add", "-b", branch, wtPath, "HEAD"], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (r.status !== 0) {
    throw new Error("git worktree add failed");
  }
  return { branch, path: wtPath };
}
