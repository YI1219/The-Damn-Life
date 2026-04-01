import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reportPath = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "smoke-report.json");
const hostWsUrl = process.env.HOST_WS ?? "ws://localhost:8787/ws";

function waitForMessage(
  queue: any[],
  waiters: Array<(msg: any) => void>,
  predicate: (msg: any) => boolean,
  timeoutMs = 10000
): Promise<any> {
  const hit = queue.find((m) => predicate(m));
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout waiting for message"));
    }, timeoutMs);

    waiters.push((msg: any) => {
      if (predicate(msg)) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });
}

async function run(): Promise<void> {
  const ws = new WebSocket(hostWsUrl);
  const messageQueue: any[] = [];
  const waiters: Array<(msg: any) => void> = [];
  ws.onmessage = async (evt: MessageEvent) => {
    let raw = "";
    if (typeof evt.data === "string") {
      raw = evt.data;
    } else if (evt.data instanceof Blob) {
      raw = await evt.data.text();
    } else {
      raw = String(evt.data);
    }
    try {
      const msg = JSON.parse(raw);
      messageQueue.push(msg);
      for (const w of waiters) w(msg);
    } catch {
      console.log("non-json message:", raw);
    }
  };
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("websocket connect failed"));
  });

  ws.send(JSON.stringify({ type: "pair.generate", payload: { name: "smoke-client" } }));
  console.log("sent: pair.generate");
  const generated = await waitForMessage(messageQueue, waiters, (m) => m.type === "pair.generated");
  console.log("recv: pair.generated");

  ws.send(JSON.stringify({
    type: "pair.confirm",
    payload: { deviceId: generated.payload.deviceId, pairCode: generated.payload.pairCode }
  }));
  console.log("sent: pair.confirm");
  const paired = await waitForMessage(messageQueue, waiters, (m) => m.type === "pair.ok");
  console.log("recv: pair.ok");
  const sessionToken = paired.payload.sessionToken as string | undefined;

  ws.send(JSON.stringify({
    type: "task.command",
    payload: { sessionId: paired.payload.sessionId, text: "整理下载文件夹", sessionToken }
  }));
  console.log("sent: task.command");
  const planned = await waitForMessage(messageQueue, waiters, (m) => m.type === "task.planned");
  console.log("recv: task.planned");

  ws.send(JSON.stringify({
    type: "task.approval",
    payload: { taskId: planned.payload.taskId, approved: false, reason: "smoke reject", sessionToken }
  }));
  console.log("sent: task.approval(reject)");
  await waitForMessage(messageQueue, waiters, (m) => m.type === "task.cancelled");
  console.log("recv: task.cancelled");

  ws.send(JSON.stringify({
    type: "audit.query",
    payload: { sessionId: paired.payload.sessionId, sessionToken }
  }));
  console.log("sent: audit.query");
  const auditResult = await waitForMessage(messageQueue, waiters, (m) => m.type === "audit.result");
  console.log("recv: audit.result");
  if (!Array.isArray(auditResult.payload) || auditResult.payload.length === 0) {
    throw new Error("audit query returned empty result");
  }

  await mkdir(dirname(reportPath), { recursive: true });
  let report: Record<string, unknown> = {};
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch {
    report = {};
  }
  report.rejectTaskId = planned.payload.taskId;
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  ws.close();
  console.log("E2E smoke test passed.");
}

run().catch((err) => {
  console.error("E2E smoke test failed:", err.message);
  process.exit(1);
});
