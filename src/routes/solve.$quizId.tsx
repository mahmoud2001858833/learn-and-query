import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getPublicQuiz, submitPublicAttempt } from "@/lib/public-quiz.functions";
import { TYPE_LABELS } from "@/lib/export";

export const Route = createFileRoute("/solve/$quizId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "حل الاختبار الإلكتروني — اسأل كتابك" },
      {
        name: "description",
        content: "حل الاختبار الإلكتروني بإدخال اسمك ورقم هاتفك، واحصل على تصحيح فوري.",
      },
      { property: "og:title", content: "حل الاختبار الإلكتروني — اسأل كتابك" },
      { property: "og:description", content: "لا حاجة لتسجيل الدخول: اسمك ورقم هاتفك فقط." },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: "https://learn-and-query.lovable.app/chemistry-quiz-share.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "https://learn-and-query.lovable.app/chemistry-quiz-share.jpg",
      },
    ],
  }),
  component: SolvePage,
});

type Result = {
  score: number;
  feedback: string | null;
  isCorrect: boolean | null;
  correctAnswer: string;
  explanation: string | null;
};

const OPEN_TYPES = ["short", "essay"];

function SolvePage() {
  const { quizId } = Route.useParams();
  const loadQuiz = useServerFn(getPublicQuiz);
  const submitAttempt = useServerFn(submitPublicAttempt);

  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, Result> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const quiz = useQuery({
    queryKey: ["public-quiz", quizId],
    queryFn: () => loadQuiz({ data: { quizId } }),
  });

  useEffect(() => {
    if (!timerOn || results) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn, results]);

  const rows = quiz.data?.questions ?? [];
  const maxScore = quiz.data?.maxScore ?? 0;
  const answered = rows.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const totalScore = useMemo(
    () => (results ? Object.values(results).reduce((sum, r) => sum + r.score, 0) : 0),
    [results],
  );

  const canStart = name.trim().length >= 3 && /^[0-9+\-\s()]{7,}$/.test(phone.trim());

  const submit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitAttempt({ data: { quizId, name, phone, answers } });
      setResults(res.results as Record<string, Result>);
      toast.success("تم تسليم الاختبار وتصحيحه");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر تسليم الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <BookOpen className="size-5 text-primary" /> اسأل كتابك
          </Link>
          {started && !results ? (
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
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {quiz.data?.title ?? "الاختبار الإلكتروني"}
          </h1>
          {started ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {answered} من {rows.length} سؤال تم الإجابة عليه
            </p>
          ) : null}
        </div>

        {quiz.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : quiz.isError ? (
          <section className="surface-card p-6 text-center">
            <p className="text-sm text-destructive">
              {quiz.error instanceof Error ? quiz.error.message : "تعذّر تحميل الاختبار"}
            </p>
          </section>
        ) : !started ? (
          <section className="surface-card space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">بيانات الطالب</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                لا تحتاج إلى تسجيل الدخول — اكتب اسمك ورقم هاتفك للبدء.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-name">الاسم الكامل</Label>
                <Input
                  id="student-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: محمود جوارنة"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-phone">رقم الهاتف</Label>
                <Input
                  id="student-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xxxxxxxx"
                  inputMode="tel"
                  dir="ltr"
                  maxLength={30}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              عدد الأسئلة: {rows.length} — الدرجة الكاملة: {maxScore}
            </p>
            <Button disabled={!canStart} onClick={() => setStarted(true)}>
              ابدأ الاختبار
            </Button>
          </section>
        ) : (
          <>
            {results ? (
              <section className="surface-card space-y-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">نتيجة {name}</p>
                <p className="text-4xl font-bold text-accent">
                  {totalScore} / {maxScore}
                </p>
                <Progress value={maxScore ? (totalScore / maxScore) * 100 : 0} />
              </section>
            ) : (
              <Progress value={rows.length ? (answered / rows.length) * 100 : 0} />
            )}

            <div className="space-y-4">
              {rows.map((q, index) => {
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
                          {result.score} / {q.points}
                        </span>
                      ) : null}
                    </div>

                    <p className="font-medium leading-relaxed text-foreground">{q.prompt}</p>

                    {q.options.length > 0 ? (
                      <RadioGroup
                        value={answers[q.id] ?? ""}
                        onValueChange={(value) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: value }))
                        }
                        disabled={Boolean(results)}
                        className="space-y-2"
                      >
                        {q.options.map((option) => (
                          <Label
                            key={option}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
                          >
                            <RadioGroupItem value={option} />
                            <span>{option}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    ) : OPEN_TYPES.includes(q.type) ? (
                      <Textarea
                        rows={4}
                        value={answers[q.id] ?? ""}
                        disabled={Boolean(results)}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="اكتب إجابتك هنا"
                      />
                    ) : (
                      <Input
                        value={answers[q.id] ?? ""}
                        disabled={Boolean(results)}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="اكتب إجابتك"
                      />
                    )}

                    {result ? (
                      <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
                        {result.correctAnswer ? (
                          <p className="text-foreground">
                            <span className="font-semibold">الإجابة الصحيحة: </span>
                            {result.correctAnswer}
                          </p>
                        ) : null}
                        {result.explanation ? (
                          <p className="text-muted-foreground">{result.explanation}</p>
                        ) : null}
                        {result.feedback ? (
                          <p className="text-muted-foreground">{result.feedback}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            {!results && rows.length > 0 ? (
              <Button className="w-full" size="lg" onClick={submit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                تسليم الاختبار
              </Button>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
