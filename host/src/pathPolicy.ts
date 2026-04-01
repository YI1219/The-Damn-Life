import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";

const allowedRoots = [resolve(homedir(), "Downloads"), resolve(homedir(), "Documents"), resolve(homedir(), "Desktop"), resolve(tmpdir())];

export function isPathAllowed(targetPath: string): boolean {
  const normalized = resolve(targetPath);
  return allowedRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`));
}
