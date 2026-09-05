// Server-only helpers for Lovable AI Gateway calls.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// OpenAI fallback model when using a direct OpenAI key instead of the Lovable gateway.
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";
const GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";

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
  const geminiKey = process.env["GEMINI_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];
  let apiKey = process.env["LOVABLE_API_KEY"];
  let url = GATEWAY_URL;
  if (geminiKey) {
    // Google's OpenAI-compatible endpoint needs a plain Gemini model id.
    apiKey = geminiKey;
    url = GEMINI_URL;
    if (typeof body["model"] === "string") body["model"] = GEMINI_FALLBACK_MODEL;
  } else if (!apiKey && openAiKey) {
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

// Models sometimes stop mid-response (token limit), leaving JSON truncated.
// Close any open string/brackets so the complete part can still be used.
function repairTruncatedJson(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  const stack: string[] = [];
  let lastSafe = -1; // index in `out` right after a completed array element

  for (const char of input) {
    out += char;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") {
      stack.pop();
      if (stack[stack.length - 1] === "[") lastSafe = out.length;
    }
  }

  if (stack.length === 0) return out;
  // Drop a partial trailing element when we're inside an array.
  if (lastSafe > 0 && stack.includes("[")) {
    const trimmed = out.slice(0, lastSafe);
    const depth: string[] = [];
    let s = false;
    let e = false;
    for (const c of trimmed) {
      if (e) { e = false; continue; }
      if (s) { if (c === "\\") e = true; else if (c === '"') s = false; continue; }
      if (c === '"') s = true;
      else if (c === "{" || c === "[") depth.push(c);
      else if (c === "}" || c === "]") depth.pop();
    }
    out = trimmed;
    stack.length = 0;
    stack.push(...depth);
  } else if (inString) {
    out += '"';
  }

  while (stack.length) {
    const open = stack.pop();
    out += open === "[" ? "]" : "}";
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
  if (start !== -1) candidates.push(cleaned.slice(start));

  for (const candidate of candidates) {
    for (const text of [
      candidate,
      escapeControlCharsInStrings(candidate),
      repairTruncatedJson(escapeControlCharsInStrings(candidate)),
    ]) {
      try {
        return JSON.parse(text) as T;
      } catch {
        // try next variant
      }
    }
  }

  // Last resort: salvage whatever complete objects exist inside the array
  // (handles heavily malformed or truncated responses).
  for (const key of ["questions", "results"] as const) {
    const idx = cleaned.indexOf(`"${key}"`);
    if (idx === -1) continue;
    const arrStart = cleaned.indexOf("[", idx);
    if (arrStart === -1) continue;
    const items = salvageObjects(escapeControlCharsInStrings(cleaned.slice(arrStart)));
    if (items.length) return { [key]: items } as T;
  }

  console.error("[ai-parse] unparsable response tail:", cleaned.slice(-400));
  throw new AiError(
    raw.trim().length === 0
      ? "لم يرجع الذكاء الاصطناعي أي محتوى. حاول مرة أخرى بعدد أسئلة أقل."
      : "جاء رد غير صالح من الذكاء الاصطناعي. حاول مرة أخرى.",
    500,
  );
}

// Scan a JSON array body and JSON.parse each balanced top-level object,
// skipping any incomplete or invalid ones.
function salvageObjects(input: string): unknown[] {
  const out: unknown[] = [];
  let depth = 0;
  let startIdx = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        try {
          out.push(JSON.parse(input.slice(startIdx, i + 1)));
        } catch {
          // skip invalid object
        }
        startIdx = -1;
      }
      if (depth < 0) break;
    } else if (c === "]" && depth === 0) break;
  }
  return out;
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
