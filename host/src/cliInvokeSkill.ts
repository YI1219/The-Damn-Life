import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_STDOUT_BYTES = 256 * 1024;
const MAX_STDERR_BYTES = 64 * 1024;

export interface CliInvokeResult {
  taskType: "cli_invoke";
  argv: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export async function runCliInvoke(argv: string[], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<CliInvokeResult> {
  const [cmd, ...args] = argv;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    let outBytes = 0;
    let errBytes = 0;
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) {
        return;
      }
      finished = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      resolve({
        taskType: "cli_invoke",
        argv,
        exitCode: null,
        stdout: stdout.slice(0, MAX_STDOUT_BYTES),
        stderr: (stderr + "\n[timeout]").slice(0, MAX_STDERR_BYTES),
        timedOut: true
      });
    }, timeoutMs);

    child.stdout?.on("data", (c: Buffer) => {
      if (outBytes >= MAX_STDOUT_BYTES) {
        return;
      }
      const s = c.toString("utf8");
      const take = Math.min(s.length, MAX_STDOUT_BYTES - outBytes);
      stdout += s.slice(0, take);
      outBytes += take;
    });
    child.stderr?.on("data", (c: Buffer) => {
      if (errBytes >= MAX_STDERR_BYTES) {
        return;
      }
      const s = c.toString("utf8");
      const take = Math.min(s.length, MAX_STDERR_BYTES - errBytes);
      stderr += s.slice(0, take);
      errBytes += take;
    });
    child.on("error", (err) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      resolve({
        taskType: "cli_invoke",
        argv,
        exitCode: code,
        stdout: stdout.slice(0, MAX_STDOUT_BYTES),
        stderr: stderr.slice(0, MAX_STDERR_BYTES),
        timedOut: false
      });
    });
  });
}
