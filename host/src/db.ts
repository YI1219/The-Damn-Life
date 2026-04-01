import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const hostDir = join(currentDir, "..");
const dbFile = join(hostDir, "data.sqlite");
const schemaFile = join(hostDir, "db", "schema.sql");

export const db = new Database(dbFile);
db.pragma("journal_mode = WAL");
db.exec(readFileSync(schemaFile, "utf8"));

function tableHasColumn(table: string, col: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === col);
}

if (!tableHasColumn("audits", "chain_prev_hash")) {
  db.exec("ALTER TABLE audits ADD COLUMN chain_prev_hash TEXT");
}
if (!tableHasColumn("audits", "record_hash")) {
  db.exec("ALTER TABLE audits ADD COLUMN record_hash TEXT");
}
if (!tableHasColumn("sessions", "ws_token")) {
  db.exec("ALTER TABLE sessions ADD COLUMN ws_token TEXT");
}

function hashAuditLink(
  prev: string,
  id: string,
  taskId: string,
  eventType: string,
  inS: string,
  outS: string,
  created: number,
  side: string
): string {
  return createHash("sha256").update(`${prev}|${id}|${taskId}|${eventType}|${inS}|${outS}|${created}|${side}`, "utf8").digest("hex");
}

const needsBackfill = db.prepare("SELECT 1 FROM audits WHERE record_hash IS NULL LIMIT 1").get();
if (needsBackfill) {
  const rows = db
    .prepare(
      "SELECT id, task_id, event_type, input_summary, output_summary, side_effect_json, created_at FROM audits ORDER BY created_at ASC, id ASC"
    )
    .all() as Array<{
      id: string;
      task_id: string;
      event_type: string;
      input_summary: string | null;
      output_summary: string | null;
      side_effect_json: string | null;
      created_at: number;
    }>;
  let prev = "";
  const upd = db.prepare("UPDATE audits SET chain_prev_hash=?, record_hash=? WHERE id=?");
  for (const r of rows) {
    const h = hashAuditLink(
      prev,
      r.id,
      r.task_id,
      r.event_type,
      r.input_summary ?? "",
      r.output_summary ?? "",
      r.created_at,
      r.side_effect_json ?? "{}"
    );
    upd.run(prev || null, h, r.id);
    prev = h;
  }
}

export function nowMs(): number {
  return Date.now();
}
