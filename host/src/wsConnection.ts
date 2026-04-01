import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { insertAudit } from "./auditLog.js";
import { db, nowMs } from "./db.js";
import { isWsTokenRequired } from "./corsConfig.js";
import { isPathAllowed } from "./pathPolicy.js";
import { resolveTaskPlanFromUserInput } from "./planner.js";
import { validateTaskPlan } from "./taskPlan.js";
import { isCliArgvAllowed } from "./cliInvokePolicy.js";
import { isFetchUrlAllowed } from "./urlPolicy.js";
import {
  parseApproval,
  parseAuditQuery,
  parseHeartbeatPayload,
  parsePairConfirm,
  parseRetry,
  parseTaskCommand
} from "./wsPayload.js";
import { validateSessionToken } from "./wsAuth.js";
import { executeTask, setTaskState } from "./taskExecutor.js";
import { previewOrganizeDownloads } from "./fileOrganizerSkill.js";

const activeSockets = new Map<string, { send: (msg: string) => void }>();

function newId(): string {
  return randomUUID();
}

function sendAuthError(socket: WebSocket): void {
  socket.send(JSON.stringify({ type: "error", payload: { message: "missing or invalid session token" } }));
}

function ensureSessionAuth(sessionId: string | undefined, token: string | undefined, socket: WebSocket): boolean {
  if (!isWsTokenRequired()) {
    return true;
  }
  if (!sessionId?.trim() || !validateSessionToken(sessionId, token)) {
    sendAuthError(socket);
    return false;
  }
  return true;
}

function ensureTaskAuth(taskId: string, token: string | undefined, socket: WebSocket): boolean {
  if (!isWsTokenRequired()) {
    return true;
  }
  const row = db.prepare("SELECT session_id FROM tasks WHERE id=?").get(taskId) as { session_id: string } | undefined;
  if (!row) {
    sendAuthError(socket);
    return false;
  }
  return ensureSessionAuth(row.session_id, token, socket);
}

export function attachClientSocket(socket: WebSocket): void {
  let currentDeviceId = "";

  socket.on("message", async (raw) => {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    let message: { type?: string; payload?: unknown };
    try {
      message = JSON.parse(text) as { type?: string; payload?: unknown };
    } catch {
      socket.send(JSON.stringify({ type: "error", payload: { message: "invalid json" } }));
      return;
    }

    if (message.type === "pair.generate") {
      const deviceId = newId();
      const pairCode = String(Math.floor(100000 + Math.random() * 900000));
      const namePayload = message.payload as { name?: string } | undefined;
      db.prepare(
        "INSERT INTO devices (id, name, pair_code, pair_code_expire_at, paired_at, last_seen_at, is_online) VALUES (?, ?, ?, ?, ?, ?, 0)"
      ).run(deviceId, namePayload?.name ?? "mobile-device", pairCode, nowMs() + 5 * 60 * 1000, nowMs(), nowMs());
      socket.send(JSON.stringify({ type: "pair.generated", payload: { deviceId, pairCode } }));
      return;
    }

    if (message.type === "pair.confirm") {
      const parsed = parsePairConfirm(message.payload);
      if (!parsed) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid pair payload" } }));
        return;
      }
      const row = db.prepare("SELECT * FROM devices WHERE id=?").get(parsed.deviceId) as
        | { pair_code: string | null; pair_code_expire_at: number | null }
        | undefined;
      if (!row || row.pair_code !== parsed.pairCode || !row.pair_code_expire_at || row.pair_code_expire_at < nowMs()) {
        socket.send(JSON.stringify({ type: "pair.failed", payload: { reason: "invalid or expired pair code" } }));
        return;
      }
      currentDeviceId = parsed.deviceId;
      db.prepare("UPDATE devices SET pair_code=NULL, pair_code_expire_at=NULL, is_online=1, last_seen_at=? WHERE id=?").run(nowMs(), currentDeviceId);
      const sessionId = newId();
      const sessionToken = newId();
      db.prepare("INSERT INTO sessions (id, device_id, started_at, ws_token) VALUES (?, ?, ?, ?)").run(sessionId, currentDeviceId, nowMs(), sessionToken);
      activeSockets.set(currentDeviceId, { send: (msg) => socket.send(msg) });
      socket.send(JSON.stringify({ type: "pair.ok", payload: { sessionId, deviceId: currentDeviceId, sessionToken } }));
      return;
    }

    if (message.type === "heartbeat") {
      const hp = parseHeartbeatPayload(message.payload);
      if (hp === null) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid heartbeat payload" } }));
        return;
      }
      if (!ensureSessionAuth(hp.sessionId, hp.sessionToken, socket)) {
        return;
      }
      if (currentDeviceId) {
        db.prepare("UPDATE devices SET is_online=1, last_seen_at=? WHERE id=?").run(nowMs(), currentDeviceId);
      }
      socket.send(JSON.stringify({ type: "heartbeat.ok", payload: { ts: nowMs() } }));
      return;
    }

    if (message.type === "task.command") {
      const parsed = parseTaskCommand(message.payload);
      if (!parsed) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid task command payload" } }));
        return;
      }
      if (!ensureSessionAuth(parsed.sessionId, parsed.sessionToken, socket)) {
        return;
      }
      const resolved = await resolveTaskPlanFromUserInput(parsed.text);
      if (!resolved) {
        socket.send(
          JSON.stringify({
            type: "task.rejected",
            payload: {
              reason: "unsupported command",
              suggestion:
                "try: 整理下载文件夹 | 抓取网页 https://… | 记录便签: … | 执行CLI echo hello（需 DAMN_LIFE_CLI_ALLOWLIST）| set DAMN_LIFE_PLANNER=ollama for broader planning"
            }
          })
        );
        return;
      }
      let plan = resolved.plan;
      if (parsed.targetDir) {
        if (plan.taskType !== "organize_downloads") {
          socket.send(
            JSON.stringify({
              type: "task.rejected",
              payload: { reason: "targetDir only applies to organize_downloads", suggestion: "remove targetDir override for this task type" }
            })
          );
          return;
        }
        if (!isPathAllowed(parsed.targetDir)) {
          socket.send(JSON.stringify({ type: "task.rejected", payload: { reason: "targetDir is outside allowed roots", suggestion: "use Downloads/Documents/Desktop/tmp" } }));
          return;
        }
        plan = { ...plan, params: { ...plan.params, targetDir: parsed.targetDir } };
      }
      if (plan.taskType === "organize_downloads" && !isPathAllowed(plan.params.targetDir)) {
        socket.send(JSON.stringify({ type: "task.rejected", payload: { reason: "targetDir is outside allowed roots", suggestion: "use Downloads/Documents/Desktop/tmp" } }));
        return;
      }
      if (plan.taskType === "fetch_page_text" && !isFetchUrlAllowed(plan.params.url)) {
        socket.send(JSON.stringify({ type: "task.rejected", payload: { reason: "URL not allowed for fetch", suggestion: "use https, or http on localhost only" } }));
        return;
      }
      if (plan.taskType === "cli_invoke" && !isCliArgvAllowed(plan.params.argv)) {
        socket.send(
          JSON.stringify({
            type: "task.rejected",
            payload: {
              reason: "cli_invoke not allowed",
              suggestion: "set DAMN_LIFE_CLI_ALLOWLIST (comma-separated) to include the executable; argv must pass safety checks"
            }
          })
        );
        return;
      }
      const taskId = newId();
      db.prepare("INSERT INTO tasks (id, session_id, state, type, summary, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(taskId, parsed.sessionId, "awaiting_approval", plan.taskType, plan.summary, JSON.stringify(plan), nowMs(), nowMs());
      insertAudit(taskId, "planned", parsed.text, plan.summary, {
        riskLevel: plan.riskLevel,
        schemaVersion: plan.schemaVersion,
        plannerSource: resolved.plannerSource,
        modelId: resolved.modelId ?? null
      });

      let preview: unknown = undefined;
      if (plan.taskType === "organize_downloads") {
        const full = await previewOrganizeDownloads(plan.params.targetDir);
        const maxMoves = 120;
        const moves = full.plannedMoves;
        preview = {
          taskType: "organize_downloads" as const,
          targetDir: full.targetDir,
          plannedMoves: moves.slice(0, maxMoves),
          skippedDirectories: full.skippedDirectories,
          warnings: full.warnings,
          totalEntries: full.totalEntries,
          totalPlannedMoves: moves.length,
          truncated: moves.length > maxMoves
        };
      }
      if (plan.taskType === "cli_invoke") {
        preview = {
          taskType: "cli_invoke" as const,
          argv: plan.params.argv
        };
      }

      socket.send(JSON.stringify({ type: "task.planned", payload: { taskId, plan, preview } }));
      return;
    }

    if (message.type === "task.approval") {
      const parsed = parseApproval(message.payload);
      if (!parsed) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid approval payload" } }));
        return;
      }
      if (!ensureTaskAuth(parsed.taskId, parsed.sessionToken, socket)) {
        return;
      }
      db.prepare("INSERT INTO approvals (id, task_id, approved, reason, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(newId(), parsed.taskId, parsed.approved ? 1 : 0, parsed.reason ?? null, nowMs());

      if (!parsed.approved) {
        setTaskState(parsed.taskId, "cancelled", parsed.reason ?? "user rejected");
        insertAudit(parsed.taskId, "approval", "approval required", "rejected", { reason: parsed.reason ?? "" });
        socket.send(JSON.stringify({ type: "task.cancelled", payload: { taskId: parsed.taskId } }));
        return;
      }

      insertAudit(parsed.taskId, "approval", "approval required", "approved", {});
      await executeTask(parsed.taskId, (payload) => socket.send(JSON.stringify(payload)));
      return;
    }

    if (message.type === "task.retry") {
      const parsed = parseRetry(message.payload);
      if (!parsed) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid retry payload" } }));
        return;
      }
      if (!ensureTaskAuth(parsed.taskId, parsed.sessionToken, socket)) {
        return;
      }
      const taskRow = db.prepare("SELECT state FROM tasks WHERE id=?").get(parsed.taskId) as { state: string } | undefined;
      if (!taskRow) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "task not found" } }));
        return;
      }
      if (taskRow.state !== "failed") {
        socket.send(JSON.stringify({ type: "task.retry.rejected", payload: { taskId: parsed.taskId, reason: "only failed tasks can be retried" } }));
        return;
      }
      if (parsed.targetDir) {
        if (!isPathAllowed(parsed.targetDir)) {
          socket.send(JSON.stringify({ type: "task.retry.rejected", payload: { taskId: parsed.taskId, reason: "targetDir is outside allowed roots" } }));
          return;
        }
        const planRow = db.prepare("SELECT payload_json FROM tasks WHERE id=?").get(parsed.taskId) as { payload_json: string } | undefined;
        if (!planRow) {
          socket.send(JSON.stringify({ type: "error", payload: { message: "task plan not found" } }));
          return;
        }
        const parsedPlan = validateTaskPlan(JSON.parse(planRow.payload_json));
        if (!parsedPlan.ok || parsedPlan.plan.taskType !== "organize_downloads") {
          socket.send(
            JSON.stringify({
              type: "task.retry.rejected",
              payload: { taskId: parsed.taskId, reason: "targetDir override only supported for organize_downloads" }
            })
          );
          return;
        }
        const plan = { ...parsedPlan.plan, params: { ...parsedPlan.plan.params, targetDir: parsed.targetDir } };
        db.prepare("UPDATE tasks SET payload_json=?, updated_at=? WHERE id=?").run(JSON.stringify(plan), nowMs(), parsed.taskId);
      }
      insertAudit(parsed.taskId, "retry", "user requested retry", "retry accepted", {});
      await executeTask(parsed.taskId, (payload) => socket.send(JSON.stringify(payload)));
      return;
    }

    if (message.type === "audit.query") {
      const aq = parseAuditQuery(message.payload);
      if (aq === null) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "invalid audit.query payload" } }));
        return;
      }
      if (!ensureSessionAuth(aq.sessionId, aq.sessionToken, socket)) {
        return;
      }
      const rows = db.prepare("SELECT * FROM audits ORDER BY created_at DESC LIMIT 20").all();
      socket.send(JSON.stringify({ type: "audit.result", payload: rows }));
      return;
    }

    socket.send(JSON.stringify({ type: "error", payload: { message: "unsupported message type" } }));
  });

  socket.on("close", () => {
    if (currentDeviceId) {
      db.prepare("UPDATE devices SET is_online=0, last_seen_at=? WHERE id=?").run(nowMs(), currentDeviceId);
      activeSockets.delete(currentDeviceId);
    }
  });
}
