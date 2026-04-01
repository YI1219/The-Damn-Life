import { db } from "./db.js";
import { computeAuditRecordHash } from "./auditLog.js";

const rows = db
  .prepare(
    "SELECT id, task_id, event_type, input_summary, output_summary, side_effect_json, created_at, chain_prev_hash, record_hash FROM audits ORDER BY created_at ASC, id ASC"
  )
  .all() as Array<{
    id: string;
    task_id: string;
    event_type: string;
    input_summary: string | null;
    output_summary: string | null;
    side_effect_json: string | null;
    created_at: number;
    chain_prev_hash: string | null;
    record_hash: string | null;
  }>;

let prev = "";
let ok = true;
for (const r of rows) {
  if (!r.record_hash) {
    console.error(`[FAIL] audit ${r.id} missing record_hash`);
    ok = false;
    continue;
  }
  const storedPrev = r.chain_prev_hash ?? "";
  if (storedPrev !== prev) {
    console.error(`[FAIL] audit ${r.id} chain_prev_hash expected "${prev}" got "${storedPrev}"`);
    ok = false;
  }
  const inS = r.input_summary ?? "";
  const outS = r.output_summary ?? "";
  const side = r.side_effect_json ?? "{}";
  const h = computeAuditRecordHash(prev, r.id, r.task_id, r.event_type, inS, outS, r.created_at, side);
  if (h !== r.record_hash) {
    console.error(`[FAIL] audit ${r.id} record_hash mismatch`);
    ok = false;
  }
  prev = r.record_hash;
}

if (ok) {
  console.log(`Audit chain OK (${rows.length} records).`);
  process.exit(0);
} else {
  console.error("Audit chain verification failed.");
  process.exit(1);
}
