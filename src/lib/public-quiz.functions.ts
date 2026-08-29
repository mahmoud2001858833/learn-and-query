import { createServerFn } from "@tanstack/react-start";

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
    const { readPublicQuiz } = await import("./public-quiz.server");
    return readPublicQuiz(data.quizId);
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
    const { savePublicAttempt } = await import("./public-quiz.server");
    return savePublicAttempt(data);
  });
