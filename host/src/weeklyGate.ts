import { db } from "./db.js";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface GateResult {
  name: string;
  passed: boolean;
  detail: string;
}

const reportPath = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "smoke-report.json");

function checkTaskState(taskId: string, expectedState: string, name: string): GateResult {
  const row = db.prepare("SELECT state FROM tasks WHERE id=?").get(taskId) as { state: string } | undefined;
  const passed = !!row && row.state === expectedState;
  return {
    name,
    passed,
    detail: passed ? `${taskId} -> ${expectedState}` : `unexpected state (${row?.state ?? "missing"})`
  };
}

function checkApprovalRecorded(taskId: string): GateResult {
  const row = db.prepare("SELECT COUNT(1) as cnt FROM approvals WHERE task_id=?").get(taskId) as { cnt: number };
  return {
    name: `approval_${taskId.slice(0, 6)}`,
    passed: row.cnt > 0,
    detail: row.cnt > 0 ? `approvals=${row.cnt}` : "No approval decisions found"
  };
}

function checkAuditRecorded(taskId: string): GateResult {
  const row = db.prepare("SELECT COUNT(1) as cnt FROM audits WHERE task_id=?").get(taskId) as { cnt: number };
  return {
    name: `audit_${taskId.slice(0, 6)}`,
    passed: row.cnt > 0,
    detail: row.cnt > 0 ? `audits=${row.cnt}` : "No audit records found"
  };
}

const report = JSON.parse(await readFile(reportPath, "utf8")) as { rejectTaskId?: string; successTaskId?: string };
if (!report.rejectTaskId || !report.successTaskId) {
  console.error("Smoke report missing task IDs. Run smoke tests first.");
  process.exit(1);
}

const results = [
  checkTaskState(report.rejectTaskId, "cancelled", "reject_flow"),
  checkTaskState(report.successTaskId, "succeeded", "success_flow"),
  checkApprovalRecorded(report.rejectTaskId),
  checkApprovalRecorded(report.successTaskId),
  checkAuditRecorded(report.rejectTaskId),
  checkAuditRecorded(report.successTaskId)
];

const allPassed = results.every((r) => r.passed);
console.log("Weekly Demo Gate:");
for (const r of results) {
  console.log(`- [${r.passed ? "PASS" : "FAIL"}] ${r.name}: ${r.detail}`);
}

if (!allPassed) {
  process.exit(1);
}
