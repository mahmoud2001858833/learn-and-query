import { createServerFn } from "@tanstack/react-start";

type PublicQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: string[];
  points: number;
};

type SubmitInput = {
  quizId: string;
  name: string;
  phone: string;
  answers: Record<string, string>;
};

/** Public: quiz title + questions WITHOUT correct answers or explanations. */
export const getPublicQuiz = createServerFn({ method: "GET" })
  .inputValidator((data: { quizId: string }) => {
    const quizId = String(data?.quizId ?? "").trim();
    if (!quizId) throw new Error("رابط الاختبار غير صحيح");
    return { quizId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("ak_quizzes")
      .select("id, title")
      .eq("id", data.quizId)
      .maybeSingle();
    if (quizError) throw quizError;
    if (!quiz) throw new Error("الاختبار غير موجود");

    const { data: rows, error } = await supabaseAdmin
      .from("ak_questions")
      .select("id, type, prompt, options, points, order_index")
      .eq("quiz_id", data.quizId)
      .order("order_index", { ascending: true });
    if (error) throw error;

    const questions: PublicQuestion[] = (rows ?? []).map((q) => ({
      id: q.id as string,
      type: q.type as string,
      prompt: q.prompt as string,
      options: Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [],
      points: (q.points as number) || 1,
    }));

    return {
      title: (quiz.title as string) ?? "اختبار",
      questions,
      maxScore: questions.reduce((sum, q) => sum + q.points, 0),
    };
  });

/** Public: grades the attempt server-side and stores it with the guest identity. */
export const submitPublicAttempt = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => {
    const quizId = String(data?.quizId ?? "").trim();
    const name = String(data?.name ?? "").trim().slice(0, 120);
    const phone = String(data?.phone ?? "").trim().slice(0, 30);
    if (!quizId) throw new Error("رابط الاختبار غير صحيح");
    if (name.length < 3) throw new Error("الاسم مطلوب (٣ أحرف على الأقل)");
    if (!/^[0-9+\-\s()]{7,}$/.test(phone)) throw new Error("رقم الهاتف غير صحيح");
    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(data?.answers ?? {})) {
      answers[String(key)] = String(value ?? "").slice(0, 5000);
    }
    return { quizId, name, phone, answers };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { gradeAttempt } = await import("./grade.server");

    const { data: rows, error } = await supabaseAdmin
      .from("ak_questions")
      .select("id, type, prompt, correct_answer, explanation, points, order_index")
      .eq("quiz_id", data.quizId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    if (!rows?.length) throw new Error("لا توجد أسئلة في هذا الاختبار");

    const { results, totalScore, maxScore } = await gradeAttempt(
      rows.map((q) => ({
        id: q.id as string,
        type: q.type as string,
        prompt: q.prompt as string,
        correct_answer: (q.correct_answer as string | null) ?? "",
        explanation: (q.explanation as string | null) ?? null,
        points: (q.points as number) || 1,
      })),
      data.answers,
    );

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("ak_attempts")
      .insert({
        quiz_id: data.quizId,
        user_id: null,
        guest_name: data.name,
        guest_phone: data.phone,
        score: totalScore,
        max_score: maxScore,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (attemptError) throw attemptError;

    const { error: answersError } = await supabaseAdmin.from("ak_answers").insert(
      rows.map((q) => {
        const id = q.id as string;
        return {
          user_id: null,
          attempt_id: attempt.id,
          question_id: id,
          answer_text: data.answers[id] ?? "",
          score: results[id]?.score ?? 0,
          is_correct: results[id]?.isCorrect ?? null,
          feedback: results[id]?.feedback ?? null,
        };
      }),
    );
    if (answersError) throw answersError;

    return { results, totalScore, maxScore };
  });
