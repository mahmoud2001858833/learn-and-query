import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_PUBLIC_URL } from "@/integrations/supabase/config";
import { normalizeAsset, type QuestionAssetData } from "@/lib/question-asset";

export type PublicQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: string[];
  points: number;
  asset: QuestionAssetData | null;
};

export type PublicQuiz = {
  title: string;
  questions: PublicQuestion[];
  maxScore: number;
};

export type PublicAttemptResult = {
  results: Record<
    string,
    {
      score: number;
      feedback: string | null;
      isCorrect: boolean | null;
      correctAnswer: string;
      explanation: string | null;
    }
  >;
  totalScore: number;
  maxScore: number;
};

function publicClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    import.meta.env["VITE_SUPABASE_URL"] ||
    SUPABASE_PUBLIC_URL;
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    SUPABASE_PUBLIC_KEY;
  if (!url || !key) throw new Error("إعدادات الاتصال بقاعدة البيانات غير متوفرة");

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function readPublicQuiz(quizId: string): Promise<PublicQuiz> {
  const { data, error } = await publicClient().rpc("ak_get_public_quiz", { _quiz_id: quizId });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("الاختبار غير موجود");
  }

  const payload = data as Record<string, Json | undefined>;
  const rawQuestions = Array.isArray(payload["questions"]) ? payload["questions"] : [];
  const questions: PublicQuestion[] = rawQuestions.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, Json | undefined>;
    const id = typeof row["id"] === "string" ? row["id"] : "";
    const prompt = typeof row["prompt"] === "string" ? row["prompt"] : "";
    if (!id || !prompt) return [];
    return [{
      id,
      type: typeof row["type"] === "string" ? row["type"] : "short",
      prompt,
      options: Array.isArray(row["options"]) ? row["options"].map(String) : [],
      points: typeof row["points"] === "number" ? row["points"] : 1,
      asset: normalizeAsset(row["asset"]),
    }];
  });

  return {
    title: typeof payload["title"] === "string" ? payload["title"] : "اختبار",
    questions,
    maxScore: questions.reduce((sum, question) => sum + question.points, 0),
  };
}

export async function savePublicAttempt(input: {
  quizId: string;
  name: string;
  phone: string;
  answers: Record<string, string>;
}): Promise<PublicAttemptResult> {
  const { data, error } = await publicClient().rpc("ak_submit_public_attempt", {
    _quiz_id: input.quizId,
    _guest_name: input.name,
    _guest_phone: input.phone,
    _answers: input.answers,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("تعذّر حفظ نتيجة الاختبار");
  }
  return data as unknown as PublicAttemptResult;
}