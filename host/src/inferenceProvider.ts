/**
 * Unified entry for **remote / heavyweight** inference backends (Ollama today; optical or other providers later).
 * Rule-based planning stays in `planner.ts`; this module is only consulted when env selects a provider.
 */
import type { TaskPlanV1 } from "./taskPlan.js";
import { tryPlanWithOllama } from "./inference/ollama.js";

export type InferenceProviderId = "ollama";

export interface InferencePlanOk {
  plan: TaskPlanV1;
  providerId: InferenceProviderId;
  modelId: string;
}

function selectedProvider(): InferenceProviderId | null {
  const explicit = (process.env.DAMN_LIFE_INFERENCE_PROVIDER ?? "").toLowerCase().trim();
  if (explicit === "ollama") {
    return "ollama";
  }
  if ((process.env.DAMN_LIFE_PLANNER ?? "").toLowerCase() === "ollama") {
    return "ollama";
  }
  return null;
}

export async function tryInferencePlan(userText: string): Promise<InferencePlanOk | null> {
  const id = selectedProvider();
  if (id === "ollama") {
    const r = await tryPlanWithOllama(userText);
    if (r) {
      return { plan: r.plan, providerId: "ollama", modelId: r.model };
    }
  }
  return null;
}
