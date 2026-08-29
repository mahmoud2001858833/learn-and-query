// Server-only helpers for Lovable AI Gateway calls.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// OpenAI fallback model when using a direct OpenAI key instead of the Lovable gateway.
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";

export type ChatContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: ChatContent };

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callGateway(body: Record<string, unknown>): Promise<string> {
  let apiKey = process.env["LOVABLE_API_KEY"];
  let url = GATEWAY_URL;
  const openAiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey && openAiKey) {
    apiKey = openAiKey;
    url = OPENAI_URL;
    // The Lovable gateway accepts "vendor/model" ids; direct OpenAI needs a plain model id.
    if (typeof body["model"] === "string") body["model"] = OPENAI_FALLBACK_MODEL;
  }
  if (!apiKey) throw new AiError("مفتاح الذكاء الاصطناعي غير مهيأ", 500);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new AiError("تم تجاوز حدّ الاستخدام مؤقتًا، حاول بعد قليل.", 429);
  }
  if (res.status === 402) {
    throw new AiError("انتهى رصيد الذكاء الاصطناعي. الرجاء إضافة رصيد للمتابعة.", 402);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[ai-gateway]", res.status, detail);
    throw new AiError("تعذّر الاتصال بمزوّد الذكاء الاصطناعي. حاول مرة أخرى.", 500);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

export async function chatText(messages: ChatMessage[], model = "google/gemini-2.5-flash") {
  return callGateway({ model, messages });
}

export async function chatJson<T>(
  messages: ChatMessage[],
  model = "google/gemini-2.5-flash",
): Promise<T> {
  const raw = await callGateway({
    model,
    messages,
    response_format: { type: "json_object" },
  });
  return parseJson<T>(raw);
}

// Models sometimes emit literal newlines/tabs inside JSON string values, which
// JSON.parse rejects ("Bad control character in string literal"). Escape them.
function escapeControlCharsInStrings(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const char of input) {
    if (escaped) {
      out += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      out += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      out += char;
      continue;
    }
    if (inString && char <= "\u001f") {
      if (char === "\n") out += "\\n";
      else if (char === "\r") out += "\\r";
      else if (char === "\t") out += "\\t";
      else out += `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
      continue;
    }
    out += char;
  }
  return out;
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(cleaned.slice(start, end + 1));

  for (const candidate of candidates) {
    for (const text of [candidate, escapeControlCharsInStrings(candidate)]) {
      try {
        return JSON.parse(text) as T;
      } catch {
        // try next variant
      }
    }
  }
  throw new AiError("جاء رد غير صالح من الذكاء الاصطناعي. حاول مرة أخرى.", 500);
}

export const QUESTION_TYPES = ["mcq", "true_false", "short", "essay", "fill_blank"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const TYPE_LABELS_AR: Record<QuestionType, string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح / خطأ",
  short: "إجابة قصيرة",
  essay: "مقالي",
  fill_blank: "إكمال الفراغ",
};
