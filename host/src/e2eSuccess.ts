import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reportPath = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "smoke-report.json");
const hostWsUrl = process.env.HOST_WS ?? "ws://localhost:8787/ws";

function waitForMessage(
  queue: any[],
  waiters: Array<(msg: any) => void>,
  predicate: (msg: any) => boolean,
  timeoutMs = 12000
): Promise<any> {
  const hit = queue.find((m) => predicate(m));
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for message")), timeoutMs);
    waiters.push((msg: any) => {
      if (predicate(msg)) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });
}

async function run(): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "damn-life-e2e-"));
  const image = join(dir, "a.jpg");
  const doc = join(dir, "b.txt");
  await writeFile(image, "fakeimg");
  await writeFile(doc, "fakedoc");

  const ws = new WebSocket(hostWsUrl);
  const queue: any[] = [];
  const waiters: Array<(msg: any) => void> = [];

  ws.onmessage = async (evt: MessageEvent) => {
    let raw: string;
    if (typeof evt.data === "string") raw = evt.data;
    else if (evt.data instanceof Blob) raw = await evt.data.text();
    else raw = String(evt.data);
    try {
      const msg = JSON.parse(raw);
      queue.push(msg);
      for (const w of waiters) w(msg);
    } catch {
      // ignore
    }
  };

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("websocket connect failed"));
  });

  ws.send(JSON.stringify({ type: "pair.generate", payload: { name: "success-client" } }));
  const generated = await waitForMessage(queue, waiters, (m) => m.type === "pair.generated");

  ws.send(JSON.stringify({
    type: "pair.confirm",
    payload: { deviceId: generated.payload.deviceId, pairCode: generated.payload.pairCode }
  }));
  const paired = await waitForMessage(queue, waiters, (m) => m.type === "pair.ok");
  const sessionToken = paired.payload.sessionToken as string | undefined;

  ws.send(JSON.stringify({
    type: "task.command",
    payload: { sessionId: paired.payload.sessionId, text: "整理下载文件夹", targetDir: dir, sessionToken }
  }));
  const planned = await waitForMessage(queue, waiters, (m) => m.type === "task.planned");

  ws.send(JSON.stringify({ type: "task.approval", payload: { taskId: planned.payload.taskId, approved: true, sessionToken } }));
  const done = await waitForMessage(queue, waiters, (m) => m.type === "task.succeeded");

  if (!done?.payload?.result || done.payload.result.moved.length < 2) {
    throw new Error("expected moved files in success flow");
  }
  for (const item of done.payload.result.moved as Array<{ to: string }>) {
    await access(item.to);
  }

  await mkdir(dirname(reportPath), { recursive: true });
  let report: Record<string, unknown>;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch {
    report = {};
  }
  report.successTaskId = done.payload.taskId;
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  ws.close();
  await rm(dir, { recursive: true, force: true });
  console.log("E2E success test passed.");
}

run().catch(async (err) => {
  console.error("E2E success test failed:", err.message);
  process.exit(1);
});
