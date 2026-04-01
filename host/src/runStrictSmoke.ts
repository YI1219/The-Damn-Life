import { execFileSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const hostDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.STRICT_SMOKE_PORT ?? "19870");

async function waitHealth(url: string, timeoutMs = 20000): Promise<void> {
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        return;
      }
    } catch {
      /* retry */
    }
    if (Date.now() - t0 > timeoutMs) {
      throw new Error(`host health timeout: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function corsProbe(base: string, origin: string): Promise<void> {
  const r = await fetch(`${base}/api/tasks?limit=1`, { headers: { Origin: origin } });
  const acao = r.headers.get("access-control-allow-origin");
  if (!acao) {
    throw new Error("CORS probe: missing Access-Control-Allow-Origin on /api/tasks");
  }
  if (acao !== "*" && acao !== origin) {
    throw new Error(`CORS probe: expected ACAO "${origin}" or "*", got "${acao}"`);
  }
}

const childEnv: NodeJS.ProcessEnv = {
  ...process.env,
  HOST_PORT: String(port),
  DAMN_LIFE_REQUIRE_WS_TOKEN: "1"
};
const corsOrigin = process.env.STRICT_SMOKE_CORS_ORIGIN?.trim();
if (corsOrigin) {
  childEnv.DAMN_LIFE_CORS_ORIGIN = corsOrigin;
}

const child = spawn("npx", ["tsx", "src/server.ts"], {
  cwd: hostDir,
  env: childEnv,
  stdio: "inherit"
});

const base = `http://127.0.0.1:${port}`;
const wsUrl = `ws://127.0.0.1:${port}/ws`;

try {
  await waitHealth(`${base}/health`);
  if (corsOrigin) {
    await corsProbe(base, corsOrigin);
    console.log(`CORS probe OK (DAMN_LIFE_CORS_ORIGIN=${corsOrigin})`);
  }

  execFileSync("npx", ["tsx", "src/e2eSmoke.ts"], {
    cwd: hostDir,
    env: { ...process.env, HOST_WS: wsUrl },
    stdio: "inherit"
  });
  execFileSync("npx", ["tsx", "src/e2eSuccess.ts"], {
    cwd: hostDir,
    env: { ...process.env, HOST_WS: wsUrl },
    stdio: "inherit"
  });
  console.log("Strict smoke (DAMN_LIFE_REQUIRE_WS_TOKEN=1) passed.");
} finally {
  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 500));
}
