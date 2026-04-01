import { createHash, randomUUID } from "node:crypto";
import { db, nowMs } from "./db.js";

function computeRecordHash(
  prevHex: string,
  id: string,
  taskId: string,
  eventType: string,
  inputSummary: string,
  outputSummary: string,
  createdAt: number,
  sideEffectJson: string
): string {
  const payload = `${prevHex}|${id}|${taskId}|${eventType}|${inputSummary}|${outputSummary}|${createdAt}|${sideEffectJson}`;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function insertAudit(taskId: string, eventType: string, inputSummary: string, outputSummary: string, sideEffect: unknown): void {
  const id = randomUUID();
  const createdAt = nowMs();
  const sideJson = JSON.stringify(sideEffect ?? {});
  const last = db
    .prepare("SELECT record_hash FROM audits WHERE record_hash IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1")
    .get() as { record_hash: string } | undefined;
  const prevHex = last?.record_hash ?? "";
  const recordHash = computeRecordHash(prevHex, id, taskId, eventType, inputSummary, outputSummary, createdAt, sideJson);
  db.prepare(
    "INSERT INTO audits (id, task_id, event_type, input_summary, output_summary, side_effect_json, created_at, chain_prev_hash, record_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, taskId, eventType, inputSummary, outputSummary, sideJson, createdAt, prevHex || null, recordHash);
}

export function computeAuditRecordHash(
  prevHex: string,
  id: string,
  taskId: string,
  eventType: string,
  inputSummary: string,
  outputSummary: string,
  createdAt: number,
  sideEffectJson: string
): string {
  return computeRecordHash(prevHex, id, taskId, eventType, inputSummary, outputSummary, createdAt, sideEffectJson);
}
