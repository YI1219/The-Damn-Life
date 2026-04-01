export type RiskLevel = "low" | "medium" | "high";

export type TaskPlanV1 =
  | {
      schemaVersion: 1;
      taskType: "organize_downloads";
      summary: string;
      requiresApproval: boolean;
      riskLevel: RiskLevel;
      params: { targetDir: string; allowDelete: boolean };
    }
  | {
      schemaVersion: 1;
      taskType: "fetch_page_text";
      summary: string;
      requiresApproval: boolean;
      riskLevel: RiskLevel;
      params: { url: string; maxChars: number };
    }
  | {
      schemaVersion: 1;
      taskType: "cli_note_echo";
      summary: string;
      requiresApproval: boolean;
      riskLevel: RiskLevel;
      params: { message: string };
    }
  | {
      schemaVersion: 1;
      taskType: "cli_invoke";
      summary: string;
      requiresApproval: boolean;
      riskLevel: RiskLevel;
      params: { argv: string[] };
    };

export interface TaskPlanValidationError {
  ok: false;
  errors: string[];
}

export type TaskPlanValidationResult = { ok: true; plan: TaskPlanV1 } | TaskPlanValidationError;

function isRiskLevel(x: unknown): x is RiskLevel {
  return x === "low" || x === "medium" || x === "high";
}

export function validateTaskPlan(raw: unknown): TaskPlanValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["plan must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (typeof o.summary !== "string" || !o.summary.trim()) {
    errors.push("summary must be a non-empty string");
  }
  if (typeof o.requiresApproval !== "boolean") {
    errors.push("requiresApproval must be boolean");
  }
  if (!isRiskLevel(o.riskLevel)) {
    errors.push("riskLevel must be low|medium|high");
  }
  if (!o.params || typeof o.params !== "object") {
    errors.push("params must be an object");
  }
  if (errors.length) {
    return { ok: false, errors };
  }

  const risk = o.riskLevel as RiskLevel;
  const taskType = o.taskType;
  const params = o.params as Record<string, unknown>;

  if (taskType === "organize_downloads") {
    if (typeof params.targetDir !== "string" || !params.targetDir.trim()) {
      errors.push("organize_downloads.params.targetDir required");
    }
    if (typeof params.allowDelete !== "boolean") {
      errors.push("organize_downloads.params.allowDelete must be boolean");
    }
    if (errors.length) {
      return { ok: false, errors };
    }
    return {
      ok: true,
      plan: {
        schemaVersion: 1,
        taskType: "organize_downloads",
        summary: o.summary as string,
        requiresApproval: o.requiresApproval as boolean,
        riskLevel: risk,
        params: { targetDir: params.targetDir as string, allowDelete: params.allowDelete as boolean }
      }
    };
  }

  if (taskType === "fetch_page_text") {
    if (typeof params.url !== "string" || params.url.length < 4) {
      errors.push("fetch_page_text.params.url required");
    }
    if (typeof params.maxChars !== "number" || !Number.isInteger(params.maxChars)) {
      errors.push("fetch_page_text.params.maxChars must be an integer");
    } else if (params.maxChars < 256 || params.maxChars > 50000) {
      errors.push("fetch_page_text.params.maxChars out of range 256..50000");
    }
    if (errors.length) {
      return { ok: false, errors };
    }
    return {
      ok: true,
      plan: {
        schemaVersion: 1,
        taskType: "fetch_page_text",
        summary: o.summary as string,
        requiresApproval: o.requiresApproval as boolean,
        riskLevel: risk,
        params: { url: params.url as string, maxChars: params.maxChars as number }
      }
    };
  }

  if (taskType === "cli_note_echo") {
    if (typeof params.message !== "string" || !params.message.trim()) {
      errors.push("cli_note_echo.params.message required");
    } else if (params.message.length > 8000) {
      errors.push("cli_note_echo.params.message too long");
    }
    if (errors.length) {
      return { ok: false, errors };
    }
    return {
      ok: true,
      plan: {
        schemaVersion: 1,
        taskType: "cli_note_echo",
        summary: o.summary as string,
        requiresApproval: o.requiresApproval as boolean,
        riskLevel: risk,
        params: { message: params.message as string }
      }
    };
  }

  if (taskType === "cli_invoke") {
    if (!Array.isArray(params.argv) || params.argv.length === 0) {
      errors.push("cli_invoke.params.argv must be a non-empty array");
    } else {
      const argv = params.argv as unknown[];
      if (argv.length > 48) {
        errors.push("cli_invoke.params.argv too many elements");
      }
      for (let i = 0; i < argv.length; i++) {
        if (typeof argv[i] !== "string" || !(argv[i] as string).trim()) {
          errors.push(`cli_invoke.params.argv[${i}] must be a non-empty string`);
        } else if ((argv[i] as string).length > 4096) {
          errors.push(`cli_invoke.params.argv[${i}] too long`);
        }
      }
    }
    if (errors.length) {
      return { ok: false, errors };
    }
    const argv = (params.argv as string[]).map((s) => s.trim());
    return {
      ok: true,
      plan: {
        schemaVersion: 1,
        taskType: "cli_invoke",
        summary: o.summary as string,
        requiresApproval: o.requiresApproval as boolean,
        riskLevel: risk,
        params: { argv }
      }
    };
  }

  return { ok: false, errors: [`unknown taskType: ${String(taskType)}`] };
}
