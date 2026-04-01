import { tryInferencePlan } from "./inferenceProvider.js";
import { validateTaskPlan, type TaskPlanV1 } from "./taskPlan.js";

export type PlannerSource = "rule" | "ollama";

export interface ResolvedPlan {
  plan: TaskPlanV1;
  plannerSource: PlannerSource;
  modelId?: string;
}

const URL_IN_TEXT = /https?:\/\/[^\s"'<>]+/i;

function firstUrl(text: string): string | null {
  const m = text.match(URL_IN_TEXT);
  return m ? m[0].replace(/[),.;]+$/, "") : null;
}

function rulePlanFromText(text: string): TaskPlanV1 | null {
  const normalized = text.trim();

  if (normalized.includes("整理下载文件夹") || normalized.toLowerCase().includes("organize downloads")) {
    return {
      schemaVersion: 1,
      taskType: "organize_downloads",
      summary: "整理下载文件夹并按文件类型归档",
      requiresApproval: true,
      riskLevel: "medium",
      params: {
        targetDir: `${process.env.HOME ?? process.cwd()}/Downloads`,
        allowDelete: false
      }
    };
  }

  const cliInvokeMatch = normalized.match(/^(?:执行CLI|cli\s+invoke)(?:[:：]\s*|\s+)(.+)$/i);
  if (cliInvokeMatch) {
    const rest = cliInvokeMatch[1].trim();
    const argv = rest.split(/\s+/).filter(Boolean);
    if (argv.length > 0) {
      const summary = `CLI: ${argv.join(" ")}`.slice(0, 200);
      return {
        schemaVersion: 1,
        taskType: "cli_invoke",
        summary,
        requiresApproval: true,
        riskLevel: "high",
        params: { argv }
      };
    }
  }

  const url = firstUrl(normalized);
  const wantsFetch =
    /抓取网页|网页正文|fetch\s*page|page\s*text|read\s*url|读取网页/i.test(normalized) || (/网页/i.test(normalized) && !!url);
  if (url && wantsFetch) {
    return {
      schemaVersion: 1,
      taskType: "fetch_page_text",
      summary: `抓取网页正文: ${url}`,
      requiresApproval: true,
      riskLevel: "medium",
      params: { url, maxChars: 12000 }
    };
  }

  let noteBody: string | null = null;
  const notePrefix = normalized.match(/^(?:记录便签|便签|note\s*echo|cli\s*note)[:：]\s*(.+)$/i);
  if (notePrefix) {
    noteBody = notePrefix[1].trim();
  } else if (/^便签[:：]\s*/i.test(normalized)) {
    noteBody = normalized.replace(/^便签[:：]\s*/i, "").trim();
  }
  if (noteBody) {
    return {
      schemaVersion: 1,
      taskType: "cli_note_echo",
      summary: `记录便签: ${noteBody.slice(0, 80)}${noteBody.length > 80 ? "…" : ""}`,
      requiresApproval: true,
      riskLevel: "low",
      params: { message: noteBody }
    };
  }

  return null;
}

export function createRuleTaskPlan(text: string): TaskPlanV1 | null {
  const plan = rulePlanFromText(text);
  if (!plan) {
    return null;
  }
  const v = validateTaskPlan(plan);
  return v.ok ? v.plan : null;
}

export async function resolveTaskPlanFromUserInput(text: string): Promise<ResolvedPlan | null> {
  const ruled = createRuleTaskPlan(text);
  if (ruled) {
    return { plan: ruled, plannerSource: "rule" };
  }

  const inferred = await tryInferencePlan(text);
  if (inferred) {
    return { plan: inferred.plan, plannerSource: "ollama", modelId: inferred.modelId };
  }

  return null;
}
