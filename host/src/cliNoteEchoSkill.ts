import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const hostSrc = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(hostSrc, "..", "..");
const handler = join(repoRoot, "skills", "cli-note-echo", "handler.py");

export interface CliNoteEchoResult {
  echoed: string;
  length: number;
}

export async function runCliNoteEcho(message: string): Promise<CliNoteEchoResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [handler, "--json"], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (c: Buffer) => {
      out += c.toString("utf8");
    });
    child.stderr.on("data", (c: Buffer) => {
      err += c.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(err.trim() || `cli-note-echo exited ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(out.trim()) as CliNoteEchoResult;
        if (typeof parsed.echoed !== "string" || typeof parsed.length !== "number") {
          reject(new Error("invalid cli-note-echo JSON"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("cli-note-echo returned non-JSON"));
      }
    });
    child.stdin.write(message, "utf8");
    child.stdin.end();
  });
}
