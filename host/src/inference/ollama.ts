import { validateTaskPlan, type TaskPlanV1 } from "../taskPlan.js";

const OLLAMA_CHAT = `${(process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, "")}/api/chat`;

const SYSTEM = `You are a planner for a local personal assistant. Output a single JSON object only (no markdown), matching this shape:
{"schemaVersion":1,"taskType":"organize_downloads"|"fetch_page_text"|"cli_note_echo"|"cli_invoke","summary":"string","requiresApproval":bool,"riskLevel":"low"|"medium"|"high","params":{...}}
Rules:
- organize_downloads: params { "targetDir": string, "allowDelete": boolean }. Use user's home Downloads path only if they ask to organize downloads; otherwise infer a reasonable directory from the message.
- fetch_page_text: params { "url": string, "maxChars": integer 256-50000 }. Use when the user wants page text from a URL.
- cli_note_echo: params { "message": string }. Use for short notes, reminders, or echo-only tasks with no filesystem side effects beyond logging.
- cli_invoke: params { "argv": string[] } non-empty argv for spawn without shell; argv[0] must match DAMN_LIFE_CLI_ALLOWLIST on the host when set. Use only when the user explicitly wants a whitelisted CLI. Prefer cli_note_echo or other task types when possible.
- High-risk or destructive intents: set riskLevel high and requiresApproval true.
If you cannot map the request, output: {"schemaVersion":1,"taskType":"cli_note_echo","summary":"无法解析为支持的任务","requiresApproval":false,"riskLevel":"low","params":{"message":"unsupported"}}`;

export interface OllamaPlanOk {
  plan: TaskPlanV1;
  model: string;
}

export async function tryPlanWithOllama(userText: string): Promise<OllamaPlanOk | null> {
  const model = process.env.DAMN_LIFE_OLLAMA_MODEL ?? "llama3.2";
  const body = {
    model,
    stream: false,
    format: "json",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userText.trim() }
    ]
  };

  let res: Response;
  try {
    res = await fetch(OLLAMA_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim();
  if (!text) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const validated = validateTaskPlan(parsed);
  if (!validated.ok) {
    return null;
  }

  if (validated.plan.taskType === "cli_note_echo" && validated.plan.params.message === "unsupported") {
    return null;
  }

  return { plan: validated.plan, model };
}
