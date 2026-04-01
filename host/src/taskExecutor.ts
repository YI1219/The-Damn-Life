import { db, nowMs } from "./db.js";
import { insertAudit } from "./auditLog.js";
import { runCliNoteEcho } from "./cliNoteEchoSkill.js";
import { runFileOrganizer } from "./fileOrganizerSkill.js";
import { runCliInvoke } from "./cliInvokeSkill.js";
import { runLightpandaFetch } from "./lightpandaFetch.js";
import { validateTaskPlan } from "./taskPlan.js";

export function setTaskState(taskId: string, state: string, failureReason?: string): void {
  db.prepare("UPDATE tasks SET state=?, failure_reason=?, updated_at=? WHERE id=?").run(state, failureReason ?? null, nowMs(), taskId);
}

function buildFailureSuggestion(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes("enoent")) {
    return "目标目录不存在，请先确认路径再重试。";
  }
  if (lower.includes("eacces") || lower.includes("permission")) {
    return "权限不足，请授予目录读写权限后重试。";
  }
  return "请检查目录状态与权限后重试。";
}

export async function executeTask(taskId: string, send: (payload: unknown) => void): Promise<void> {
  setTaskState(taskId, "running");

  const taskRow = db.prepare("SELECT payload_json, summary FROM tasks WHERE id=?").get(taskId) as
    | { payload_json: string; summary: string }
    | undefined;
  if (!taskRow) {
    send({ type: "error", payload: { message: "task not found" } });
    return;
  }

  let planRaw: unknown;
  try {
    planRaw = JSON.parse(taskRow.payload_json);
  } catch {
    const reason = "invalid task payload JSON";
    setTaskState(taskId, "failed", reason);
    insertAudit(taskId, "execution", taskRow.summary, "failed", { reason, suggestion: "recreate the task from the client" });
    send({ type: "task.failed", payload: { taskId, reason, suggestion: "recreate the task from the client" } });
    return;
  }

  const validated = validateTaskPlan(planRaw);
  if (!validated.ok) {
    const reason = `invalid plan: ${validated.errors.join("; ")}`;
    setTaskState(taskId, "failed", reason);
    insertAudit(taskId, "execution", taskRow.summary, "failed", { reason, suggestion: "plan failed schema validation" });
    send({ type: "task.failed", payload: { taskId, reason, suggestion: "plan failed schema validation" } });
    return;
  }

  const plan = validated.plan;

  try {
    if (plan.taskType === "organize_downloads") {
      send({ type: "task.progress", payload: { taskId, step: "running file organizer" } });
      const result = await runFileOrganizer(plan.params.targetDir, (progress) => {
        send({
          type: "task.progress",
          payload: { taskId, step: "moving files", processed: progress.processed, total: progress.total, current: progress.current }
        });
      });
      setTaskState(taskId, "succeeded");
      insertAudit(taskId, "execution", taskRow.summary, `moved ${result.moved.length} files`, result);
      send({ type: "task.succeeded", payload: { taskId, result } });
      return;
    }

    if (plan.taskType === "fetch_page_text") {
      send({ type: "task.progress", payload: { taskId, step: "lightpanda fetch", url: plan.params.url } });
      let text = await runLightpandaFetch(plan.params.url);
      if (text.length > plan.params.maxChars) {
        text = text.slice(0, plan.params.maxChars);
      }
      const result = {
        taskType: plan.taskType,
        url: plan.params.url,
        textLength: text.length,
        preview: text.slice(0, 500)
      };
      setTaskState(taskId, "succeeded");
      insertAudit(taskId, "execution", taskRow.summary, `fetched ${result.textLength} chars`, result);
      send({ type: "task.succeeded", payload: { taskId, result } });
      return;
    }

    if (plan.taskType === "cli_note_echo") {
      send({ type: "task.progress", payload: { taskId, step: "cli note echo" } });
      const result = await runCliNoteEcho(plan.params.message);
      setTaskState(taskId, "succeeded");
      insertAudit(taskId, "execution", taskRow.summary, `note length ${result.length}`, result);
      send({ type: "task.succeeded", payload: { taskId, result } });
      return;
    }

    if (plan.taskType === "cli_invoke") {
      send({ type: "task.progress", payload: { taskId, step: "cli_invoke", argv: plan.params.argv } });
      const result = await runCliInvoke(plan.params.argv);
      if (result.timedOut || result.exitCode !== 0) {
        const reason = result.timedOut
          ? "cli_invoke timed out"
          : `cli_invoke exited with code ${result.exitCode}`;
        const suggestion = result.timedOut
          ? "Increase timeout in cliInvokeSkill or simplify the command."
          : "Check stderr in the failed payload; fix argv or allowlist.";
        setTaskState(taskId, "failed", reason);
        insertAudit(taskId, "execution", taskRow.summary, "failed", { reason, result });
        send({ type: "task.failed", payload: { taskId, reason, suggestion, result } });
        return;
      }
      setTaskState(taskId, "succeeded");
      insertAudit(taskId, "execution", taskRow.summary, `cli_invoke ok`, result);
      send({ type: "task.succeeded", payload: { taskId, result } });
      return;
    }

    const _never: never = plan;
    void _never;
    throw new Error("unsupported taskType in executor");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown failure";
    const suggestion =
      plan.taskType === "fetch_page_text"
        ? "Install Lightpanda, set LIGHTPANDA_PATH, and use an allowed https or localhost http URL."
        : plan.taskType === "cli_note_echo"
          ? "Ensure python3 is available and skills/cli-note-echo/handler.py exists."
          : plan.taskType === "cli_invoke"
            ? "Ensure DAMN_LIFE_CLI_ALLOWLIST includes the executable, argv is safe, and the binary exists on PATH."
            : buildFailureSuggestion(reason);
    setTaskState(taskId, "failed", reason);
    insertAudit(taskId, "execution", taskRow.summary, "failed", { reason, suggestion });
    send({ type: "task.failed", payload: { taskId, reason, suggestion } });
  }
}
