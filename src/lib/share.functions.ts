import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SendQuizInput = { quizId: string; email: string; mode: "copy" | "move" };

export const sendQuizToAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SendQuizInput) => {
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("البريد الإلكتروني غير صحيح");
    }
    if (!data.quizId) throw new Error("لا يوجد اختبار محدد");
    return { quizId: data.quizId, email, mode: data.mode === "move" ? "move" : "copy" } as const;
  })
  .handler(async ({ data, context }) => {
    // Verify the caller owns this quiz (RLS-scoped client).
    const { data: quiz, error: quizError } = await context.supabase
      .from("ak_quizzes")
      .select(
        "id, title, language, difficulty, question_count, type_mix, custom_prompt, status, document_id",
      )
      .eq("id", data.quizId)
      .single();
    if (quizError || !quiz) throw new Error("الاختبار غير موجود أو لا تملك صلاحية عليه");

    const { data: questions, error: questionsError } = await context.supabase
      .from("ak_questions")
      .select("type, prompt, options, correct_answer, explanation, points, order_index")
      .eq("quiz_id", data.quizId)
      .order("order_index", { ascending: true });
    if (questionsError) throw questionsError;
    if (!questions?.length) throw new Error("لا توجد أسئلة في هذا الاختبار");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: targetId, error: lookupError } = await supabaseAdmin.rpc("ak_user_id_by_email", {
      _email: data.email,
    });
    if (lookupError) throw lookupError;
    if (!targetId) {
      throw new Error("لا يوجد حساب بهذا البريد الإلكتروني. اطلب منه إنشاء حساب أولًا.");
    }
    if (targetId === context.userId) {
      throw new Error("هذا بريدك الحالي — اختر حسابًا آخر");
    }

    if (data.mode === "move") {
      const { error: moveQuiz } = await supabaseAdmin
        .from("ak_quizzes")
        .update({ user_id: targetId, document_id: null })
        .eq("id", quiz.id);
      if (moveQuiz) throw moveQuiz;
      const { error: moveQuestions } = await supabaseAdmin
        .from("ak_questions")
        .update({ user_id: targetId })
        .eq("quiz_id", quiz.id);
      if (moveQuestions) throw moveQuestions;
      return { quizId: quiz.id, mode: "move" as const, questions: questions.length };
    }

    const { data: newQuiz, error: insertQuizError } = await supabaseAdmin
      .from("ak_quizzes")
      .insert({
        user_id: targetId,
        document_id: null,
        title: quiz.title,
        language: quiz.language,
        difficulty: quiz.difficulty,
        question_count: quiz.question_count,
        type_mix: quiz.type_mix,
        custom_prompt: quiz.custom_prompt,
        status: quiz.status,
      })
      .select("id")
      .single();
    if (insertQuizError || !newQuiz) throw insertQuizError ?? new Error("تعذّر إنشاء نسخة الاختبار");

    const { error: insertQuestionsError } = await supabaseAdmin.from("ak_questions").insert(
      questions.map((q) => ({
        quiz_id: newQuiz.id,
        user_id: targetId,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        order_index: q.order_index,
      })),
    );
    if (insertQuestionsError) {
      await supabaseAdmin.from("ak_quizzes").delete().eq("id", newQuiz.id);
      throw insertQuestionsError;
    }

    return { quizId: newQuiz.id, mode: "copy" as const, questions: questions.length };
  });
