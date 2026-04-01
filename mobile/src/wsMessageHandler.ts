import type { Dispatch, SetStateAction } from "react";

export type PendingPlan = {
  taskId: string;
  summary: string;
  riskLevel: string;
  detail: string;
  previewSummary?: string;
  previewJson?: string;
};

export type WsUiContext = {
  pushMessage: (from: "user" | "assistant", text: string) => void;
  setProgressText: Dispatch<SetStateAction<string>>;
  setPairCode: Dispatch<SetStateAction<string>>;
  setDeviceId: Dispatch<SetStateAction<string>>;
  setSessionId: Dispatch<SetStateAction<string>>;
  setSessionToken: Dispatch<SetStateAction<string>>;
  setTaskId: Dispatch<SetStateAction<string>>;
  setLastFailedTaskId: Dispatch<SetStateAction<string>>;
  setPendingPlan: Dispatch<SetStateAction<PendingPlan | null>>;
};

/** 绑定 `onmessage` / `onclose`，与手动连接、快速连接共用。 */
export function wireHostWebSocket(ws: WebSocket, ctx: WsUiContext): void {
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data as string) as { type?: string; payload?: unknown };
    applyHostWsMessage(msg, ctx);
  };
  ws.onclose = () => {
    ctx.pushMessage("assistant", "连接已断开。");
  };
}

export function applyHostWsMessage(msg: { type?: string; payload?: unknown }, ctx: WsUiContext): void {
  const { pushMessage, setProgressText, setPairCode, setDeviceId, setSessionId, setSessionToken, setTaskId, setLastFailedTaskId, setPendingPlan } =
    ctx;
  const payload = msg.payload as Record<string, unknown> | undefined;

  if (msg.type === "task.progress") {
    const p = payload ?? {};
    const text =
      typeof p.processed === "number" && typeof p.total === "number"
        ? `进行中 ${p.processed}/${p.total}，当前: ${(p.current as string) ?? "-"}`
        : (p.step as string) ?? "执行中";
    setProgressText(text);
    pushMessage("assistant", `task.progress: ${text}`);
  } else {
    pushMessage("assistant", `${msg.type}: ${JSON.stringify(msg.payload)}`);
  }

  if (msg.type === "pair.generated" && payload) {
    setPairCode(String(payload.pairCode ?? ""));
    setDeviceId(String(payload.deviceId ?? ""));
  }
  if (msg.type === "pair.ok" && payload) {
    setSessionId(String(payload.sessionId ?? ""));
    if (payload.sessionToken !== undefined) {
      setSessionToken(String(payload.sessionToken));
    }
  }
  if (msg.type === "task.planned" && payload) {
    setTaskId(String(payload.taskId ?? ""));
    const plan = payload.plan as { summary?: string; riskLevel?: string; params?: unknown } | undefined;
    const rawPreview = payload.preview as
      | {
          taskType?: string;
          argv?: string[];
          totalPlannedMoves?: number;
          skippedDirectories?: string[];
          warnings?: string[];
          truncated?: boolean;
        }
      | undefined;
    let previewSummary: string | undefined;
    let previewJson: string | undefined;
    if (rawPreview && rawPreview.taskType === "cli_invoke" && Array.isArray(rawPreview.argv) && rawPreview.argv.length > 0) {
      previewSummary = `干跑预览：将执行 ${rawPreview.argv.join(" ")}`;
      previewJson = JSON.stringify(payload.preview, null, 2);
    } else if (rawPreview && typeof rawPreview.totalPlannedMoves === "number") {
      const skipped = rawPreview.skippedDirectories?.length ?? 0;
      previewSummary = `干跑预览：将移动 ${rawPreview.totalPlannedMoves} 个文件；跳过 ${skipped} 个子目录。`;
      if (rawPreview.truncated) {
        previewSummary += "（明细列表已截断）";
      }
      if (rawPreview.warnings?.length) {
        previewSummary += ` 注意：${rawPreview.warnings.join("；")}`;
      }
      previewJson = JSON.stringify(payload.preview, null, 2);
    }
    if (plan) {
      setPendingPlan({
        taskId: String(payload.taskId ?? ""),
        summary: String(plan.summary ?? ""),
        riskLevel: String(plan.riskLevel ?? ""),
        detail: JSON.stringify(plan.params ?? {}, null, 2),
        previewSummary,
        previewJson
      });
    }
  }
  if (msg.type === "task.failed" && payload) {
    setLastFailedTaskId(String(payload.taskId ?? ""));
  }
  if (msg.type === "task.succeeded" || msg.type === "task.failed" || msg.type === "task.cancelled") {
    setProgressText("");
    setPendingPlan(null);
  }
}
