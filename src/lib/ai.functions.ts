import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeAsset } from "./question-asset";
import {
  buildGeneratePrompt,
  buildGradePrompt,
  buildSinglePrompt,
  chatJson,
  chatText,
  clampText,
  type GeneratedQuestion,
  type GradeResultItem,
} from "./ai.helpers.server";

/** Keeps only valid, sanitized assets so a question never carries broken markup. */
function withCleanAsset(question: GeneratedQuestion): GeneratedQuestion {
  const asset = normalizeAsset(question.asset);
  return { ...question, asset };
}


export const ocrImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { images: string[] }) => {
    if (!Array.isArray(data.images) || data.images.length === 0) {
      throw new Error("لا توجد صور للقراءة");
    }
    return { images: data.images.slice(0, 12) };
  })
  .handler(async ({ data }) => {
    const text = await chatText([
      {
        role: "system",
        content:
          "أنت قارئ مستندات دقيق. استخرج كل النص الظاهر في الصور حرفيًا وبالترتيب، دون تعليق أو تلخيص.",
      },
      {
        role: "user",
        content: [
          { type: "text" as const, text: "استخرج النص الكامل من هذه الصفحات:" },
          ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
        ],
      },
    ]);
    return { text };
  });

export const generateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      text: string;
      count: number;
      difficulty: string;
      language: string;
      typeMix: Record<string, number>;
      customPrompt?: string | undefined;
      avoid?: string[] | undefined;
    }) => {
      if (!data.text || data.text.trim().length < 40) {
        throw new Error("النص المستخرج قصير جدًا لتوليد أسئلة");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const result = await chatJson<{ questions: GeneratedQuestion[] }>(
      buildGeneratePrompt({ ...data, text: clampText(data.text) }),
    );
    return { questions: (result.questions ?? []).map(withCleanAsset) };
  });

export const regenerateQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { text: string; type: string; difficulty: string; language: string; avoid?: string }) => data,
  )
  .handler(async ({ data }) => {
    const result = await chatJson<{ questions: GeneratedQuestion[] }>(
      buildSinglePrompt({ ...data, text: clampText(data.text, 30000) }),
    );
    const first = result.questions?.[0];
    return { question: first ? withCleanAsset(first) : null };
  });

export const gradeOpenAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      items: Array<{ id: string; prompt: string; expected: string; answer: string; points: number }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    if (data.items.length === 0) return { results: [] as GradeResultItem[] };
    const result = await chatJson<{ results: GradeResultItem[] }>(buildGradePrompt(data.items));
    return { results: result.results ?? [] };
  });
