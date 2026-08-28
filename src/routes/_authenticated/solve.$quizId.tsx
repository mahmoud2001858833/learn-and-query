import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { gradeOpenAnswers } from "@/lib/ai.functions";
import { TYPE_LABELS } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/solve/$quizId")({
  head: () => ({
    meta: [
      { title: "حل الاختبار — اسأل كتابك" },
      { name: "description", content: "حل الاختبار إلكترونيًا واحصل على تصحيح فوري مع الشرح." },
      { property: "og:title", content: "حل الاختبار — اسأل كتابك" },
      { property: "og:description", content: "تصحيح فوري للدرجة مع شرح لكل سؤال." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SolvePage,
});

type QuestionRow = {
  id: string;
  type: string;
  prompt: string;
  options: unknown;
  correct_answer: string | null;
  explanation: string | null;
  points: number;
};

type Result = { score: number; feedback: string | null; isCorrect: boolean | null };

const OPEN_TYPES = ["short", "essay"];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function SolvePage() {
  const { user } = Route.useRouteContext();
  const { quizId } = Route.useParams();
  const runGrade = useServerFn(gradeOpenAnswers);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, Result> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const quiz = useQuery({
    queryKey: ["ak-quiz", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_quizzes")
        .select("id, title")
        .eq("id", quizId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const questions = useQuery({
    queryKey: ["ak-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_questions")
        .select("id, type, prompt, options, correct_answer, explanation, points")
        .eq("quiz_id", quizId)
        .order("order_index");
      if (error) throw error;
      return data as QuestionRow[];
    },
  });

  useEffect(() => {
    if (!timerOn || results) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn, results]);

  const rows = questions.data ?? [];
  const maxScore = useMemo(() => rows.reduce((sum, q) => sum + (q.points || 1), 0), [rows]);
  const answered = rows.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const totalScore = results
    ? Object.values(results).reduce((sum, r) => sum + r.score, 0)
    : 0;

  const submit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const computed: Record<string, Result> = {};
      for (const q of rows) {
        if (OPEN_TYPES.includes(q.type)) continue;
        const given = normalize(answers[q.id] ?? "");
        const correct = normalize(q.correct_answer ?? "");
        const isCorrect = given.length > 0 && given === correct;
        computed[q.id] = {
          score: isCorrect ? q.points || 1 : 0,
          feedback: null,
          isCorrect,
        };
      }

      const openItems = rows
        .filter((q) => OPEN_TYPES.includes(q.type))
        .map((q) => ({
          id: q.id,
          prompt: q.prompt,
          expected: q.correct_answer ?? "",
          answer: answers[q.id] ?? "",
          points: q.points || 1,
        }));

      if (openItems.length) {
        const { results: graded } = await runGrade({ data: { items: openItems } });
        for (const item of openItems) {
          const match = graded.find((g) => g.id === item.id);
          const score = Math.max(0, Math.min(item.points, match?.score ?? 0));
          computed[item.id] = {
            score,
            feedback: match?.feedback ?? null,
            isCorrect: score >= item.points * 0.6,
          };
        }
      }

      const { data: attempt, error: attemptError } = await supabase
        .from("ak_attempts")
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: Object.values(computed).reduce((sum, r) => sum + r.score, 0),
          max_score: maxScore,
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (attemptError) throw attemptError;

      const { error: answersError } = await supabase.from("ak_answers").insert(
        rows.map((q) => ({
          user_id: user.id,
          attempt_id: attempt.id,
          question_id: q.id,
          answer_text: answers[q.id] ?? "",
          score: computed[q.id]?.score ?? 0,
          is_correct: computed[q.id]?.isCorrect ?? null,
          feedback: computed[q.id]?.feedback ?? null,
        })),
      );
      if (answersError) throw answersError;

      setResults(computed);
      toast.success("تم التصحيح");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر تسليم الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {quiz.data?.title ?? "حل الاختبار"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {answered} من {rows.length} سؤال تم الإجابة عليه
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-accent" /> مؤقّت
              <Switch checked={timerOn} onCheckedChange={setTimerOn} />
            </Label>
            {timerOn ? (
              <span className="font-mono text-sm text-muted-foreground">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            ) : null}
          </div>
        </div>

        {results ? (
          <section className="surface-card space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">نتيجتك</p>
            <p className="text-4xl font-bold text-accent">
              {totalScore} / {maxScore}
            </p>
            <Progress value={maxScore ? (totalScore / maxScore) * 100 : 0} />
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">لوحة الحساب</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/quiz/$quizId" params={{ quizId }}>
                  تحرير وتصدير
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <Progress value={rows.length ? (answered / rows.length) * 100 : 0} />
        )}

        {questions.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-4">
            {rows.map((q, index) => {
              const options = Array.isArray(q.options) ? q.options.map(String) : [];
              const result = results?.[q.id];
              return (
                <article key={q.id} className="surface-card space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <Badge variant="secondary">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                    </div>
                    {result ? (
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          result.isCorrect ? "text-accent" : "text-destructive"
                        }`}
                      >
                        {result.isCorrect ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        {result.score} / {q.points || 1}
                      </span>
                    ) : null}
                  </div>

                  <p className="font-medium text-foreground">{q.prompt}</p>

                  {options.length > 0 ? (
                    <RadioGroup
                      dir="rtl"
                      value={answers[q.id] ?? ""}
                      onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                      disabled={Boolean(results)}
                    >
                      {options.map((opt) => (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <RadioGroupItem value={opt} />
                          {opt}
                        </label>
                      ))}
                    </RadioGroup>
                  ) : q.type === "essay" ? (
                    <Textarea
                      rows={5}
                      disabled={Boolean(results)}
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="اكتب إجابتك هنا…"
                    />
                  ) : (
                    <Input
                      disabled={Boolean(results)}
                      value={answers[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="إجابتك…"
                    />
                  )}

                  {result ? (
                    <div className="space-y-2 rounded-lg bg-secondary p-4 text-sm">
                      <p className="text-foreground">
                        <span className="font-semibold">الإجابة الصحيحة: </span>
                        {q.correct_answer ?? "—"}
                      </p>
                      {q.explanation ? (
                        <p className="text-muted-foreground">
                          <span className="font-semibold">الشرح: </span>
                          {q.explanation}
                        </p>
                      ) : null}
                      {result.feedback ? (
                        <p className="text-muted-foreground">
                          <span className="font-semibold">تعليق المصحّح: </span>
                          {result.feedback}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {!results && rows.length > 0 ? (
          <Button size="lg" className="w-full" disabled={submitting} onClick={submit}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            تسليم وتصحيح فوري
          </Button>
        ) : null}
      </main>
    </div>
  );
}
