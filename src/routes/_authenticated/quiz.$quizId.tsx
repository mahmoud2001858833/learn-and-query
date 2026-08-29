import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileDown, Loader2, PlayCircle, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { CopyQuizLinkButton } from "@/components/CopyQuizLinkButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { regenerateQuestion } from "@/lib/ai.functions";
import { exportQuizDocx, exportQuizPdf, TYPE_LABELS } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/quiz/$quizId")({
  head: () => ({
    meta: [
      { title: "تحرير الاختبار — اسأل كتابك" },
      { name: "description", content: "عدّل الأسئلة أو أعد توليدها ثم صدّرها PDF أو Word." },
      { property: "og:title", content: "تحرير الاختبار — اسأل كتابك" },
      { property: "og:description", content: "تحرير وتصدير الأسئلة المولّدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizEditor,
});

type QuestionRow = {
  id: string;
  type: string;
  prompt: string;
  options: unknown;
  correct_answer: string | null;
  explanation: string | null;
  order_index: number;
  points: number;
};

function toOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function QuizEditor() {
  const { user } = Route.useRouteContext();
  const { quizId } = Route.useParams();
  const queryClient = useQueryClient();
  const runRegenerate = useServerFn(regenerateQuestion);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const quiz = useQuery({
    queryKey: ["ak-quiz", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_quizzes")
        .select("id, title, difficulty, language, document_id")
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
        .select("id, type, prompt, options, correct_answer, explanation, order_index, points")
        .eq("quiz_id", quizId)
        .order("order_index");
      if (error) throw error;
      return data as QuestionRow[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ak-questions", quizId] });

  const saveQuestion = async (q: QuestionRow, patch: Partial<QuestionRow>) => {
    const { error } = await supabase
      .from("ak_questions")
      .update({
        prompt: patch.prompt ?? q.prompt,
        correct_answer: patch.correct_answer ?? q.correct_answer,
        explanation: patch.explanation ?? q.explanation,
        options: (patch.options ?? q.options) as never,
      })
      .eq("id", q.id);
    if (error) toast.error("تعذّر الحفظ");
    else {
      toast.success("تم الحفظ");
      refresh();
    }
  };

  const removeQuestion = async (id: string) => {
    const { error } = await supabase.from("ak_questions").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else {
      toast.success("تم حذف السؤال");
      refresh();
    }
  };

  const regenerate = async (q: QuestionRow) => {
    if (!quiz.data?.document_id) {
      toast.error("لا يوجد مستند مرتبط لإعادة التوليد");
      return;
    }
    setPendingId(q.id);
    try {
      const { data: doc, error } = await supabase
        .from("ak_documents")
        .select("extracted_text")
        .eq("id", quiz.data.document_id)
        .single();
      if (error) throw error;

      const { question } = await runRegenerate({
        data: {
          text: doc.extracted_text ?? "",
          type: q.type,
          difficulty: quiz.data.difficulty,
          language: quiz.data.language,
          avoid: q.prompt,
        },
      });
      if (!question) throw new Error("لم يتم توليد سؤال بديل");

      const { error: updateError } = await supabase
        .from("ak_questions")
        .update({
          prompt: question.prompt,
          options: (question.options ?? []) as never,
          correct_answer: question.correct_answer ?? null,
          explanation: question.explanation ?? null,
        })
        .eq("id", q.id);
      if (updateError) throw updateError;
      toast.success("تم إعادة توليد السؤال");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّرت إعادة التوليد");
    } finally {
      setPendingId(null);
    }
  };

  const exportRows = (questions.data ?? []).map((q, i) => ({
    position: i + 1,
    type: q.type,
    prompt: q.prompt,
    options: toOptions(q.options),
    correct_answer: q.correct_answer,
    explanation: q.explanation,
  }));

  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (kind: "docx" | "pdf", withAnswers: boolean) => {
    const title = quiz.data?.title ?? "اختبار";
    const key = `${kind}-${withAnswers}`;
    setExporting(key);
    try {
      if (kind === "docx") await exportQuizDocx(title, exportRows, withAnswers);
      else await exportQuizPdf(title, exportRows, withAnswers);
      toast.success("تم تنزيل الملف");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر التصدير");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {quiz.data?.title ?? "تحرير الاختبار"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {questions.data?.length ?? 0} سؤال · يمكنك التعديل أو الحذف أو إعادة التوليد.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyQuizLinkButton quizId={quizId} variant="secondary" size="default" />
            <SendQuizDialog quizId={quizId} size="default" variant="outline" />
            <Button asChild>
              <Link to="/solve/$quizId" params={{ quizId }}>
                <PlayCircle className="size-4" />
                حل إلكتروني
              </Link>
            </Button>
          </div>
        </div>

        <section className="surface-card flex flex-wrap gap-2 p-4">
          {(
            [
              { kind: "pdf", answers: false, label: "PDF أسئلة" },
              { kind: "pdf", answers: true, label: "PDF إجابات" },
              { kind: "docx", answers: false, label: "Word أسئلة" },
              { kind: "docx", answers: true, label: "Word إجابات" },
            ] as const
          ).map((item) => {
            const key = `${item.kind}-${item.answers}`;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                disabled={exporting !== null}
                onClick={() => doExport(item.kind, item.answers)}
              >
                {exporting === key ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}{" "}
                {item.label}
              </Button>
            );
          })}
        </section>

        {questions.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-4">
            {questions.data?.map((q, index) => (
              <QuestionCard
                key={q.id}
                index={index}
                question={q}
                pending={pendingId === q.id}
                onSave={(patch) => saveQuestion(q, patch)}
                onDelete={() => removeQuestion(q.id)}
                onRegenerate={() => regenerate(q)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  pending,
  onSave,
  onDelete,
  onRegenerate,
}: {
  index: number;
  question: QuestionRow;
  pending: boolean;
  onSave: (patch: Partial<QuestionRow>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [answer, setAnswer] = useState(question.correct_answer ?? "");
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [options, setOptions] = useState<string[]>(toOptions(question.options));

  return (
    <article className="surface-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </span>
          <Badge variant="secondary">{TYPE_LABELS[question.type] ?? question.type}</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={pending} onClick={onRegenerate}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            إعادة توليد
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
            حذف
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>نص السؤال</Label>
        <Textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </div>

      {options.length > 0 ? (
        <div className="space-y-2">
          <Label>الخيارات</Label>
          {options.map((opt, i) => (
            <Input
              key={i}
              value={opt}
              onChange={(e) =>
                setOptions((prev) => prev.map((o, oi) => (oi === i ? e.target.value : o)))
              }
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>الإجابة الصحيحة</Label>
          <Textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>الشرح</Label>
          <Textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>
      </div>

      <Button
        size="sm"
        onClick={() =>
          onSave({ prompt, correct_answer: answer, explanation, options: options as never })
        }
      >
        <Save className="size-4" />
        حفظ التعديلات
      </Button>
    </article>
  );
}
