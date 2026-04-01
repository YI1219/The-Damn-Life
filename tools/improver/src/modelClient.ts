/**
 * OpenAI-compatible chat completions (HTTPS). Used only by tools/improver.
 * Env: DAMN_LIFE_CHAT_API_BASE, DAMN_LIFE_CHAT_API_KEY, DAMN_LIFE_CHAT_MODEL
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function normalizeBase(base: string): string {
  return base.replace(/\/$/, "");
}

function chatCompletionsUrl(base: string): string {
  const b = normalizeBase(base);
  if (b.endsWith("/v1")) {
    return `${b}/chat/completions`;
  }
  return `${b}/v1/chat/completions`;
}

export class ModelClient {
  private readonly base: string;
  private readonly apiKey: string;
  readonly model: string;

  constructor() {
    const base = process.env.DAMN_LIFE_CHAT_API_BASE?.trim();
    const key = process.env.DAMN_LIFE_CHAT_API_KEY?.trim();
    if (!base || !key) {
      throw new Error("Set DAMN_LIFE_CHAT_API_BASE and DAMN_LIFE_CHAT_API_KEY for improver");
    }
    this.base = normalizeBase(base);
    this.apiKey = key;
    this.model = process.env.DAMN_LIFE_CHAT_MODEL?.trim() || "gpt-4o-mini";
  }

  async completeJson(messages: ChatMessage[]): Promise<string> {
    const url = chatCompletionsUrl(this.base);
    const body = {
      model: this.model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" as const }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Chat API ${res.status}: ${t.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Empty model response");
    }
    return text;
  }
}
