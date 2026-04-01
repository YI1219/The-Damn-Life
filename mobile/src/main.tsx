import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { wireHostWebSocket, type PendingPlan } from "./wsMessageHandler";

type Message = { from: "user" | "assistant"; text: string; at: string };
type TaskHistory = {
  id: string;
  state: string;
  type: string;
  summary: string;
  failure_reason: string | null;
  updated_at: number;
};
const hostStorageKey = "damnLife.hostOrigin";
const hostRecentStorageKey = "damnLife.recentHostOrigins";
const hostLastSuccessKey = "damnLife.lastSuccessHostOrigin";

function getDefaultHostOrigin(): string {
  return `${window.location.protocol}//${window.location.hostname || "localhost"}:8787`;
}

function readStoredHostOrigin(): string {
  const stored = localStorage.getItem(hostStorageKey);
  return stored || getDefaultHostOrigin();
}

function readRecentOrigins(current: string): string[] {
  const raw = localStorage.getItem(hostRecentStorageKey);
  if (!raw) return [current];
  try {
    const list = JSON.parse(raw) as string[];
    const dedup = [current, ...list.filter((item) => item !== current)];
    return dedup.slice(0, 6);
  } catch {
    return [current];
  }
}

function persistOrigins(current: string, recent: string[]): void {
  localStorage.setItem(hostStorageKey, current);
  localStorage.setItem(hostRecentStorageKey, JSON.stringify(recent.slice(0, 6)));
}

function persistLastSuccess(origin: string): void {
  localStorage.setItem(hostLastSuccessKey, origin);
}

function readLastSuccess(): string | null {
  return localStorage.getItem(hostLastSuccessKey);
}

function validateHostOrigin(input: string): string | null {
  const value = input.trim();
  if (!value) return "主控地址不能为空";
  try {
    const u = new URL(value);
    if (!(u.protocol === "http:" || u.protocol === "https:")) {
      return "仅支持 http 或 https 协议";
    }
    if (!u.port) {
      return "请显式包含端口，例如 :8787";
    }
    return null;
  } catch {
    return "地址格式无效，请输入完整 URL";
  }
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pairCode, setPairCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [taskId, setTaskId] = useState("");
  const [input, setInput] = useState("整理下载文件夹");
  const [lastFailedTaskId, setLastFailedTaskId] = useState("");
  const [retryTargetDir, setRetryTargetDir] = useState("");
  const [progressText, setProgressText] = useState("");
  const [commandTargetDir, setCommandTargetDir] = useState("");
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [hostOrigin, setHostOrigin] = useState(() => readStoredHostOrigin());
  const [recentOrigins, setRecentOrigins] = useState<string[]>(() => readRecentOrigins(readStoredHostOrigin()));
  const [hostError, setHostError] = useState<string | null>(null);
  const [isQuickConnecting, setIsQuickConnecting] = useState(false);
  const [showPreviewDetail, setShowPreviewDetail] = useState(false);

  useEffect(() => {
    if (!pendingPlan) {
      setShowPreviewDetail(false);
    }
  }, [pendingPlan]);

  const wsUrl = useMemo(() => {
    try {
      const u = new URL(hostOrigin);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${u.host}/ws`;
    } catch {
      const fallback = new URL(getDefaultHostOrigin());
      const proto = fallback.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${fallback.host}/ws`;
    }
  }, [hostOrigin]);

  function pushMessage(from: "user" | "assistant", text: string) {
    setMessages((prev) => [...prev, { from, text, at: new Date().toLocaleTimeString() }].slice(-120));
  }

  function connect() {
    const trimmed = hostOrigin.trim();
    const validationError = validateHostOrigin(trimmed);
    setHostError(validationError);
    if (validationError) {
      pushMessage("assistant", validationError);
      return;
    }
    const recent = [trimmed, ...recentOrigins.filter((item) => item !== trimmed)].slice(0, 6);
    setRecentOrigins(recent);
    setHostOrigin(trimmed);
    persistOrigins(trimmed, recent);
    const ws = new WebSocket(wsUrl);
    const ctx = {
      pushMessage,
      setProgressText,
      setPairCode,
      setDeviceId,
      setSessionId,
      setSessionToken,
      setTaskId,
      setLastFailedTaskId,
      setPendingPlan
    };
    wireHostWebSocket(ws, ctx);
    ws.onopen = () => {
      pushMessage("assistant", "连接主控成功。");
      persistLastSuccess(trimmed);
      void loadTaskHistory();
    };
    setSocket(ws);
  }

  function connectToOrigin(origin: string): Promise<boolean> {
    return new Promise((resolve) => {
      const validationError = validateHostOrigin(origin);
      if (validationError) {
        resolve(false);
        return;
      }
      let settled = false;
      const u = new URL(origin);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${u.host}/ws`);

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { ws.close(); } catch { /* ignore */ }
          resolve(false);
        }
      }, 1800);

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        setSocket(ws);
        setHostOrigin(origin);
        const recent = [origin, ...recentOrigins.filter((item) => item !== origin)].slice(0, 6);
        setRecentOrigins(recent);
        persistOrigins(origin, recent);
        persistLastSuccess(origin);
        pushMessage("assistant", `快速连接成功：${origin}`);
        void loadTaskHistory();

        wireHostWebSocket(ws, {
          pushMessage,
          setProgressText,
          setPairCode,
          setDeviceId,
          setSessionId,
          setSessionToken,
          setTaskId,
          setLastFailedTaskId,
          setPendingPlan
        });
        resolve(true);
      };
      ws.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      };
    });
  }

  async function quickConnect() {
    if (isQuickConnecting) return;
    setIsQuickConnecting(true);
    setHostError(null);
    const lastSuccess = readLastSuccess();
    const ordered = [
      ...(lastSuccess ? [lastSuccess] : []),
      ...recentOrigins.filter((item) => item !== lastSuccess)
    ];
    for (const origin of ordered) {
      pushMessage("assistant", `尝试连接：${origin}`);
      // eslint-disable-next-line no-await-in-loop
      const ok = await connectToOrigin(origin);
      if (ok) {
        setIsQuickConnecting(false);
        return;
      }
    }
    pushMessage("assistant", "快速连接失败，请手动检查主控地址。");
    setIsQuickConnecting(false);
  }

  function sendCommand() {
    if (!socket || !sessionId || !input.trim()) return;
    pushMessage("user", input.trim());
    socket.send(JSON.stringify({
      type: "task.command",
      payload: {
        sessionId,
        text: input.trim(),
        targetDir: commandTargetDir.trim() || undefined,
        sessionToken: sessionToken || undefined
      }
    }));
  }

  function retryFailedTask() {
    if (!socket) return;
    socket.send(JSON.stringify({
      type: "task.retry",
      payload: {
        taskId: lastFailedTaskId || taskId,
        targetDir: retryTargetDir.trim() || undefined,
        sessionToken: sessionToken || undefined
      }
    }));
  }

  async function loadTaskHistory() {
    const url = new URL("/api/tasks", hostOrigin);
    url.searchParams.set("limit", "15");
    if (sessionId) {
      url.searchParams.set("sessionId", sessionId);
    }
    const resp = await fetch(url.toString());
    const data = await resp.json();
    setHistory(data.tasks ?? []);
  }

  function approvePending(approved: boolean) {
    if (!socket || !pendingPlan) return;
    socket.send(JSON.stringify({
      type: "task.approval",
      payload: {
        taskId: pendingPlan.taskId,
        approved,
        reason: approved ? undefined : "用户在计划卡片中拒绝",
        sessionToken: sessionToken || undefined
      }
    }));
  }

  function chooseRecent(origin: string) {
    setHostOrigin(origin);
    setHostError(validateHostOrigin(origin));
    const recent = [origin, ...recentOrigins.filter((item) => item !== origin)].slice(0, 6);
    setRecentOrigins(recent);
    persistOrigins(origin, recent);
  }

  function removeRecent(origin: string) {
    const next = recentOrigins.filter((item) => item !== origin);
    const safe = next.length > 0 ? next : [getDefaultHostOrigin()];
    setRecentOrigins(safe);
    if (hostOrigin === origin) {
      setHostOrigin(safe[0]);
      setHostError(validateHostOrigin(safe[0]));
      persistOrigins(safe[0], safe);
    } else {
      persistOrigins(hostOrigin, safe);
    }
  }

  function clearRecent() {
    const fallback = getDefaultHostOrigin();
    setRecentOrigins([fallback]);
    setHostOrigin(fallback);
    setHostError(validateHostOrigin(fallback));
    persistOrigins(fallback, [fallback]);
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1>The Damn Life Chat</h1>
      <section style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={connect}>连接主控</button>
        <button onClick={quickConnect} disabled={isQuickConnecting}>
          {isQuickConnecting ? "快速连接中..." : "快速连接最近成功地址"}
        </button>
        <button onClick={() => socket?.send(JSON.stringify({ type: "pair.generate", payload: { name: "mobile-web" } }))}>生成配对码</button>
        <button onClick={() => socket?.send(JSON.stringify({ type: "pair.confirm", payload: { deviceId, pairCode } }))}>确认配对</button>
        <button
          onClick={() =>
            socket?.send(
              JSON.stringify({
                type: "heartbeat",
                payload: { sessionId: sessionId || undefined, sessionToken: sessionToken || undefined }
              })
            )
          }
        >
          心跳
        </button>
        <button onClick={retryFailedTask}>重试失败任务</button>
        <button
          onClick={() =>
            socket?.send(
              JSON.stringify({
                type: "audit.query",
                payload: { sessionId: sessionId || undefined, sessionToken: sessionToken || undefined }
              })
            )
          }
        >
          查审计
        </button>
        <button onClick={loadTaskHistory}>任务历史</button>
      </section>
      <section style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={hostOrigin}
          onChange={(e) => {
            const next = e.target.value;
            setHostOrigin(next);
            setHostError(validateHostOrigin(next));
          }}
          placeholder="主控地址，例如 http://192.168.0.8:8787"
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button onClick={clearRecent}>清空历史</button>
      </section>
      {hostError ? <p style={{ color: "#c33", margin: "0 0 10px" }}>{hostError}</p> : null}
      <section style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {recentOrigins.map((origin) => (
          <span key={origin} style={{ display: "inline-flex", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
            <button onClick={() => chooseRecent(origin)} style={{ border: "none", padding: "6px 8px" }}>{origin}</button>
            <button onClick={() => removeRecent(origin)} style={{ border: "none", borderLeft: "1px solid #ddd", padding: "6px 8px" }}>x</button>
          </span>
        ))}
      </section>
      <p style={{ margin: "6px 0" }}>deviceId: {deviceId || "-"}</p>
      <p style={{ margin: "6px 0" }}>pairCode: {pairCode || "-"}</p>
      <p style={{ margin: "6px 0" }}>sessionId: {sessionId || "-"}</p>
      <p style={{ margin: "6px 0" }}>taskId: {taskId || "-"}</p>
      <p style={{ margin: "6px 0 16px" }}>sessionToken: {sessionToken ? "已下发（配对后）" : "-"}</p>
      {pendingPlan ? (
        <section style={{ border: "1px solid #99c", borderRadius: 8, padding: 12, marginBottom: 12, background: "#f4f6ff" }}>
          <h3 style={{ marginTop: 0 }}>待审批任务</h3>
          <div><b>任务</b>: {pendingPlan.summary}</div>
          <div><b>参数</b>:</div>
          <pre style={{ margin: "6px 0", whiteSpace: "pre-wrap", fontSize: 13 }}>{pendingPlan.detail}</pre>
          <div><b>风险</b>: {pendingPlan.riskLevel}</div>
          {pendingPlan.previewSummary ? (
            <div style={{ margin: "10px 0", background: "#e8ecff", padding: 10, borderRadius: 6 }}>
              <div>{pendingPlan.previewSummary}</div>
              {pendingPlan.previewJson ? (
                <button type="button" style={{ marginTop: 8 }} onClick={() => setShowPreviewDetail((v) => !v)}>
                  {showPreviewDetail ? "收起干跑明细" : "展开干跑明细"}
                </button>
              ) : null}
              {showPreviewDetail && pendingPlan.previewJson ? (
                <pre style={{ marginTop: 8, fontSize: 11, maxHeight: 220, overflow: "auto", background: "#fff", padding: 8 }}>{pendingPlan.previewJson}</pre>
              ) : null}
            </div>
          ) : null}
          <p style={{ fontSize: 13, color: "#555", margin: "8px 0 0" }}>
            审计记录带哈希链，便于事后核对；本机若被完全控制仍可能改库，请妥善保管设备。
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                const u = new URL("/api/receipt", hostOrigin);
                u.searchParams.set("taskId", pendingPlan.taskId);
                void navigator.clipboard.writeText(u.toString()).then(
                  () => pushMessage("assistant", "已复制收据链接到剪贴板。"),
                  () => pushMessage("assistant", `收据 URL（请手动复制）：${u.toString()}`)
                );
              }}
            >
              复制任务收据链接
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => approvePending(true)}>批准执行</button>
            <button onClick={() => approvePending(false)}>拒绝执行</button>
          </div>
        </section>
      ) : null}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 240, background: "#fafafa" }}>
        {progressText ? <div style={{ marginBottom: 10, color: "#0a7", fontWeight: 600 }}>⏳ {progressText}</div> : null}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <b>{m.from === "user" ? "你" : "助手"}</b> <small>{m.at}</small>
            <div>{m.text}</div>
          </div>
        ))}
      </section>
      <section style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入指令，例如：整理下载文件夹"
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button onClick={sendCommand}>发送</button>
      </section>
      <section style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={commandTargetDir}
          onChange={(e) => setCommandTargetDir(e.target.value)}
          placeholder="可选：覆盖执行目录，例如 /Users/you/Downloads"
          style={{ flex: 1, padding: "8px 10px" }}
        />
      </section>
      <section style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={retryTargetDir}
          onChange={(e) => setRetryTargetDir(e.target.value)}
          placeholder="失败重试可改目录，例如 /Users/you/Downloads"
          style={{ flex: 1, padding: "8px 10px" }}
        />
      </section>
      {history.length > 0 ? (
        <section style={{ marginTop: 14, borderTop: "1px dashed #bbb", paddingTop: 10 }}>
          <h3 style={{ margin: "0 0 10px" }}>最近任务</h3>
          {history.map((h) => (
            <div key={h.id} style={{ padding: "8px 10px", border: "1px solid #eee", borderRadius: 6, marginBottom: 8 }}>
              <div><b>{h.summary}</b> ({h.type})</div>
              <div>状态: {h.state}</div>
              {h.failure_reason ? <div>失败原因: {h.failure_reason}</div> : null}
              <div>更新时间: {new Date(h.updated_at).toLocaleString()}</div>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
