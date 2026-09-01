// Prompt builders and AI helpers (server-only).
export { chatJson, chatText, AiError, TYPE_LABELS_AR } from "./ai.server";
import { type ChatMessage, TYPE_LABELS_AR } from "./ai.server";

export type GeneratedQuestion = {
  type: string;
  prompt: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  points?: number;
  asset?: unknown;
};

export type GradeResultItem = { id: string; score: number; feedback: string };

export function clampText(text: string, max = 60000) {
  return text.length > max ? `${text.slice(0, max)}\n...[تم اقتصار النص]` : text;
}

const SCHEMA_NOTE = `أعد كائن JSON فقط بالشكل:
{"questions":[{"type":"mcq|true_false|short|essay|fill_blank","prompt":"نص السؤال","options":["..."],"correct_answer":"الإجابة الصحيحة","explanation":"شرح موجز","points":1,"asset":null}]}
قواعد:
- mcq: 4 خيارات في options، و correct_answer مطابق حرفيًا لأحد الخيارات.
- true_false: options = ["صح","خطأ"] و correct_answer أحدهما.
- fill_blank: استخدم ــــ مكان الفراغ، و correct_answer هو الكلمة الناقصة.
- short و essay: options فارغة، correct_answer إجابة نموذجية.
- كل سؤال يجب أن يكون مبنيًا على محتوى النص المرفق فقط، ولا تكرار.

المرفقات (جدول أو شكل) — قاعدة إلزامية:
- إذا كان نص السؤال يشير إلى جدول أو بيانات أو قيم أو شكل أو رسم أو مخطط ("حسب الجدول التالي"، "من البيانات المجاورة"، "في الشكل التالي")، فيجب أن يحتوي الحقل asset على المرفق كاملًا. ممنوع منعًا تامًا إنشاء سؤال يشير إلى جدول أو شكل غير موجود.
- إن لم يكن هناك مرفق فاجعل asset = null، ولا تُشِر في نص السؤال إلى أي جدول أو شكل.
- جدول: {"kind":"table","caption":"عنوان الجدول","headers":["العمود ١","العمود ٢"],"rows":[["قيمة","قيمة"]]} — كل الخلايا نصوص، والقيم كافية لحل السؤال.
- شكل/صورة توضيحية: {"kind":"figure","caption":"وصف الشكل","svg":"<svg viewBox=\\"0 0 400 260\\" xmlns=\\"http://www.w3.org/2000/svg\\">…</svg>"}
- ارسم الشكل بـ SVG خالص فقط (rect, line, circle, path, polyline, polygon, text) بألوان واضحة على خلفية بيضاء، بدون script أو صور خارجية أو روابط، وبحد أقصى 4000 حرف، واكتب النصوص العربية داخل عناصر text بحجم مقروء (14px أو أكثر).
- استخدم الشكل للرسوم البيانية، الدوائر الكهربائية، الأدوات المخبرية، التراكيب الكيميائية، والمخططات — وليس لتزيين السؤال.`;


export function buildGeneratePrompt(input: {
  text: string;
  count: number;
  difficulty: string;
  language: string;
  typeMix: Record<string, number>;
  customPrompt?: string | undefined;
  avoid?: string[] | undefined;
}): ChatMessage[] {
  const mix = Object.entries(input.typeMix)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${TYPE_LABELS_AR[type as keyof typeof TYPE_LABELS_AR] ?? type} (${type}): ${n} سؤال`)
    .join("، ");

  const avoidList = (input.avoid ?? []).slice(-60);

  return [
    {
      role: "system",
      content:
        "أنت خبير مناهج ومقيّم تعليمي محترف. تقرأ المحتوى بعمق، تفهم نية المستخدم من تعليماته الحرة وتنفّذها بحذافيرها (الفصل المطلوب، الموضوع، الأسلوب، صيغة السؤال). توزّع الأسئلة على مستويات بلوم (تذكّر، فهم، تطبيق، تحليل)، تصيغ مشتّتات منطقية غير واضحة الخطأ في أسئلة الاختيار من متعدد، تتأكد أن كل إجابة صحيحة فعلًا ومستندة إلى النص، وتكتب شرحًا يذكر موضع الفكرة في المحتوى. لا تخرج عن المحتوى المرفق ولا تكرّر سؤالًا. تُجيب بـ JSON صالح فقط.",
    },
    {
      role: "user",
      content: `المحتوى:\n"""\n${input.text}\n"""\n\nالمطلوب: ${input.count} سؤالًا بلغة ${input.language === "en" ? "الإنجليزية" : "العربية"}، مستوى الصعوبة: ${input.difficulty}.\nتوزيع الأنواع: ${mix || "وزّعها بشكل متوازن"}.\n${input.customPrompt ? `تعليمات المستخدم (أعلى أولوية، التزم بها حرفيًا): ${input.customPrompt}\n` : ""}${avoidList.length ? `أسئلة موجودة سابقًا، لا تكرّرها ولا تعد صياغتها:\n- ${avoidList.join("\n- ")}\n` : ""}\n${SCHEMA_NOTE}`,
    },
  ];
}

export function buildSinglePrompt(input: {
  text: string;
  type: string;
  difficulty: string;
  language: string;
  avoid?: string | undefined;
}): ChatMessage[] {
  return [
    { role: "system", content: "أنت خبير إعداد اختبارات. تُجيب بـ JSON صالح فقط." },
    {
      role: "user",
      content: `المحتوى:\n"""\n${input.text}\n"""\n\nأنشئ سؤالًا واحدًا فقط من نوع ${input.type} بمستوى ${input.difficulty} بلغة ${input.language === "en" ? "الإنجليزية" : "العربية"}.\n${input.avoid ? `لا تكرر هذا السؤال: ${input.avoid}\n` : ""}\n${SCHEMA_NOTE}`,
    },
  ];
}

export function buildGradePrompt(
  items: Array<{ id: string; prompt: string; expected: string; answer: string; points: number }>,
): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "أنت مصحّح تعليمي عادل. تقيّم إجابات الطلاب المقالية والقصيرة وتعطي درجة جزئية وتعليقًا مفيدًا بالعربية. تُجيب بـ JSON صالح فقط.",
    },
    {
      role: "user",
      content: `صحّح الإجابات التالية:\n${JSON.stringify(items, null, 1)}\n\nأعد JSON بالشكل: {"results":[{"id":"معرّف السؤال","score":درجة رقمية لا تتجاوز points,"feedback":"تعليق قصير يوضح ما ينقص"}]}`,
    },
  ];
}
