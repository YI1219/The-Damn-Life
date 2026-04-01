import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { db, nowMs } from "./db.js";
import { getCorsAllowOrigin } from "./corsConfig.js";

function corsHeaders(): Record<string, string> {
  const origin = getCorsAllowOrigin();
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown, withCors: boolean): void {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8" };
  if (withCors) {
    Object.assign(headers, corsHeaders());
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

export function handleHttp(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  const withCors = true;

  if (req.method === "OPTIONS" && (path === "/api/tasks" || path === "/health" || path === "/api/receipt")) {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && path === "/health") {
    sendJson(res, 200, { ok: true, ts: nowMs() }, withCors);
    return;
  }

  if (req.method === "GET" && path === "/api/tasks") {
    const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? 20), 100));
    const sessionId = url.searchParams.get("sessionId") ?? undefined;
    const rows = sessionId
      ? db
          .prepare(
            "SELECT id, session_id, state, type, summary, failure_reason, created_at, updated_at FROM tasks WHERE session_id=? ORDER BY created_at DESC LIMIT ?"
          )
          .all(sessionId, limit)
      : db
          .prepare(
            "SELECT id, session_id, state, type, summary, failure_reason, created_at, updated_at FROM tasks ORDER BY created_at DESC LIMIT ?"
          )
          .all(limit);
    sendJson(res, 200, { tasks: rows }, withCors);
    return;
  }

  if (req.method === "GET" && path === "/api/receipt") {
    const taskId = url.searchParams.get("taskId")?.trim();
    if (!taskId) {
      sendJson(res, 400, { error: "missing taskId" }, withCors);
      return;
    }
    const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(taskId);
    if (!task) {
      sendJson(res, 404, { error: "task not found" }, withCors);
      return;
    }
    const approvals = db.prepare("SELECT * FROM approvals WHERE task_id=? ORDER BY created_at ASC").all(taskId);
    const audits = db.prepare("SELECT id, event_type, input_summary, output_summary, created_at, chain_prev_hash, record_hash FROM audits WHERE task_id=? ORDER BY created_at ASC").all(
      taskId
    );
    sendJson(
      res,
      200,
      {
        schemaVersion: 1,
        task,
        approvals,
        audits,
        exportedAt: nowMs()
      },
      withCors
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
}
