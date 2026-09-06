import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyFigureStyle,
  DEFAULT_FIGURE_STYLE,
  normalizeAsset,
  validateFigureSvg,
  type FigureStyle,
  type QuestionAssetData,
} from "./question-asset";
import {
  buildFigurePrompt,
  buildFigureRepairPrompt,
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

/** Verifies a figure, styles it, and asks the model once to fix real layout problems. */
async function verifyAsset(
  asset: QuestionAssetData | null | undefined,
  questionPrompt: string,
  style: FigureStyle,
): Promise<QuestionAssetData | null> {
  const clean = normalizeAsset(asset);
  if (!clean) return null;
  if (clean.kind !== "figure") return clean;

  const styled = { ...clean, svg: applyFigureStyle(clean.svg, style) };
  const first = validateFigureSvg(styled.svg);
  if (first.ok) return styled;

  try {
    const repaired = await chatJson<{ asset?: unknown }>(
      buildFigureRepairPrompt({
        questionPrompt,
        svg: styled.svg,
        problems: first.problems,
        style,
      }),
    );
    const fixed = normalizeAsset(repaired.asset);
    if (fixed && fixed.kind === "figure") {
      const restyled = { ...fixed, svg: applyFigureStyle(fixed.svg, style) };
      if (validateFigureSvg(restyled.svg).ok) return restyled;
      return restyled; // still better than the original draft
    }
    if (fixed) return fixed; // model replaced the drawing with a table
  } catch (error) {
    console.error("[figure-repair]", error);
  }
  // Unusable drawing: drop it rather than show a wrong figure.
  return null;
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
      figureStyle?: FigureStyle | undefined;
    }) => {
      if (!data.text || data.text.trim().length < 40) {
        throw new Error("النص المستخرج قصير جدًا لتوليد أسئلة");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const style = data.figureStyle ?? DEFAULT_FIGURE_STYLE;
    const result = await chatJson<{ questions: GeneratedQuestion[] }>(
      buildGeneratePrompt({ ...data, text: clampText(data.text), figureStyle: style }),
    );
    const drafts = (result.questions ?? []).map(withCleanAsset);
    const questions = await Promise.all(
      drafts.map(async (q) => ({
        ...q,
        asset: await verifyAsset(q.asset, q.prompt, style),
      })),
    );
    return { questions };
  });

export const regenerateQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      text: string;
      type: string;
      difficulty: string;
      language: string;
      avoid?: string;
      figureStyle?: FigureStyle | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    const style = data.figureStyle ?? DEFAULT_FIGURE_STYLE;
    const result = await chatJson<{ questions: GeneratedQuestion[] }>(
      buildSinglePrompt({ ...data, text: clampText(data.text, 30000), figureStyle: style }),
    );
    const first = result.questions?.[0];
    if (!first) return { question: null };
    const cleaned = withCleanAsset(first);
    return {
      question: { ...cleaned, asset: await verifyAsset(cleaned.asset, cleaned.prompt, style) },
    };
  });

/** Draws or redraws the figure/table attached to one question, with validation. */
export const generateFigure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      questionPrompt: string;
      instruction?: string | undefined;
      currentSvg?: string | undefined;
      figureStyle?: FigureStyle | undefined;
    }) => {
      if (!data.questionPrompt?.trim()) throw new Error("لا يوجد نص سؤال لرسم الشكل");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const style = data.figureStyle ?? DEFAULT_FIGURE_STYLE;
    const result = await chatJson<{ asset?: unknown }>(
      buildFigurePrompt({
        questionPrompt: data.questionPrompt,
        instruction: data.instruction,
        currentSvg: data.currentSvg,
        style,
      }),
    );
    const asset = await verifyAsset(normalizeAsset(result.asset), data.questionPrompt, style);
    if (!asset) throw new Error("تعذّر رسم شكل صالح، حاول بتعليمات أوضح");
    const check = asset.kind === "figure" ? validateFigureSvg(asset.svg) : { ok: true, problems: [] };
    return { asset, problems: check.problems };
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
