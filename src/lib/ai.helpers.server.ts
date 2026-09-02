// Prompt builders and AI helpers (server-only).
export { chatJson, chatText, AiError, TYPE_LABELS_AR } from "./ai.server";
import { type ChatMessage, TYPE_LABELS_AR } from "./ai.server";
import type { QuestionAssetData } from "./question-asset";

export type GeneratedQuestion = {
  type: string;
  prompt: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  points?: number;
  asset?: QuestionAssetData | null;
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
- شكل/صورة توضيحية: {"kind":"figure","caption":"وصف الشكل","svg":"<svg viewBox=\\"0 0 480 320\\" xmlns=\\"http://www.w3.org/2000/svg\\">…</svg>"}

قواعد رسم الشكل (SVG) — التزم بها بدقة وإلا اجعل asset = null أو استخدم جدولًا بدلًا من الشكل:
1) الأفضل دائمًا الجدول إذا كانت البيانات رقمية. لا ترسم شكلًا إلا إذا كان الشكل ضروريًا لفهم السؤال (منحنى، دائرة كهربائية، أداة مخبرية، تركيب كيميائي، مخطط).
2) ابدأ دائمًا بـ <svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg"> بدون width أو height، وضع خلفية بيضاء عبر <rect x="0" y="0" width="480" height="320" fill="#ffffff"/>.
3) استخدم فقط: rect, line, circle, ellipse, path, polyline, polygon, text, g. بدون script أو image أو foreignObject أو روابط أو CSS خارجي أو <style>. الحد الأقصى 4000 حرف.
4) اترك هامشًا لا يقل عن 40px من كل جهة، وابقِ كل عنصر داخل حدود 480×320 تمامًا. لا تسمح بأي تداخل بين النصوص أو بين النص والأشكال — احسب موضع كل نص بعناية.
5) النصوص: قصيرة جدًا (كلمة أو رقم أو رمز، بحد أقصى 14 حرفًا)، font-size من 14 إلى 18، fill="#111827"، واستخدم text-anchor="middle" للنص فوق/تحت العنصر و text-anchor="end" لتسميات المحور الرأسي. لا تُدوّر النص (بدون rotate) ولا تكتب جُملًا داخل الشكل — الجملة مكانها نص السؤال أو caption.
6) الخطوط: stroke="#1e3a8a" وstroke-width="2" على الأقل، وfill="none" للمسارات. استخدم ألوانًا واضحة ومتباينة (#1e3a8a، #0f9b78، #b91c1c، #b45309) على أن تبقى الخلفية بيضاء.
7) للمنحنيات والرسوم البيانية: ارسم محورين بخطين مستقيمين مع أسهم بسيطة، وضع تسميات المحاور والوحدات، وعلّم قيمًا رقمية على المحاور تكفي لاستخراج الجواب من الشكل.
8) للدوائر الكهربائية والأدوات المخبرية: ارسم أشكالًا هندسية بسيطة ومتناسبة (بطارية، مقاومة كمستطيل، دورق كمسار)، وسمِّ كل عنصر بتسمية واحدة خارج الشكل.
9) تأكد قبل الإخراج أن كل القيم التي يحتاجها السؤال ظاهرة فعليًا في الشكل، وأن الشكل يبدو مرتبًا ومتماثلًا ومهنيًا، وأن جميع الأقواس والوسوم مغلقة بشكل صحيح.`;


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
