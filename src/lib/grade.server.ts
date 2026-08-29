import { chatJson } from "./ai.server";
import { buildGradePrompt } from "./ai.helpers.server";

export type GradableQuestion = {
  id: string;
  type: string;
  prompt: string;
  correct_answer: string;
  explanation: string | null;
  points: number;
};

export type GradedResult = {
  score: number;
  feedback: string | null;
  isCorrect: boolean | null;
  correctAnswer: string;
  explanation: string | null;
};

const OPEN_TYPES = ["short", "essay"];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function gradeAttempt(
  questions: GradableQuestion[],
  answers: Record<string, string>,
) {
  const results: Record<string, GradedResult> = {};

  for (const q of questions) {
    if (OPEN_TYPES.includes(q.type)) continue;
    const given = normalize(answers[q.id] ?? "");
    const correct = normalize(q.correct_answer);
    const isCorrect = given.length > 0 && given === correct;
    results[q.id] = {
      score: isCorrect ? q.points : 0,
      feedback: null,
      isCorrect,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    };
  }

  const openItems = questions
    .filter((q) => OPEN_TYPES.includes(q.type))
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      expected: q.correct_answer,
      answer: answers[q.id] ?? "",
      points: q.points,
    }));

  if (openItems.length) {
    let graded: Array<{ id: string; score: number; feedback: string }> = [];
    try {
      const result = await chatJson<{
        results: Array<{ id: string; score: number; feedback: string }>;
      }>(buildGradePrompt(openItems));
      graded = result.results ?? [];
    } catch {
      graded = [];
    }
    for (const item of openItems) {
      const q = questions.find((x) => x.id === item.id)!;
      const match = graded.find((g) => g.id === item.id);
      const score = Math.max(0, Math.min(item.points, match?.score ?? 0));
      results[item.id] = {
        score,
        feedback: match?.feedback ?? null,
        isCorrect: score >= item.points * 0.6,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      };
    }
  }

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  return { results, totalScore, maxScore };
}
