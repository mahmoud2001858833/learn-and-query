import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, Library, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { FigureStyleFields } from "@/components/FigureStyleFields";
import { DEFAULT_FIGURE_STYLE, type FigureStyle } from "@/lib/question-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { extractFromFile } from "@/lib/extract";
import { generateQuestions, ocrImages } from "@/lib/ai.functions";
import { TYPE_LABELS } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "اختبار جديد — اسأل كتابك" },
      {
        name: "description",
        content: "ارفع ملفًا أو اختر كتابًا محفوظًا وولّد أي عدد من الأسئلة بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "اختبار جديد — اسأل كتابك" },
      { property: "og:description", content: "ارفع محتواك مرة واحدة وولّد أسئلة بلا حدود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewQuiz,
});

const TYPES = ["mcq", "true_false", "short", "essay", "fill_blank"] as const;
const BATCH_SIZE = 12;

type Batch = { typeMix: Record<string, number>; count: number };

function planBatches(mix: Record<string, number>): Batch[] {
  const batches: Batch[] = [];
  for (const type of TYPES) {
    let left = mix[type] ?? 0;
    while (left > 0) {
      const take = Math.min(BATCH_SIZE, left);
      batches.push({ typeMix: { [type]: take }, count: take });
      left -= take;
    }
  }
  return batches;
}

function NewQuiz() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const runOcr = useServerFn(ocrImages);
  const runGenerate = useServerFn(generateQuestions);

  const [file, setFile] = useState<File | null>(null);
  const [savedDocId, setSavedDocId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [difficulty, setDifficulty] = useState("متوسط");
  const [language, setLanguage] = useState("ar");
  const [customPrompt, setCustomPrompt] = useState("");
  const [figureStyle, setFigureStyle] = useState<FigureStyle>(DEFAULT_FIGURE_STYLE);
  const [mix, setMix] = useState<Record<string, number>>({
    mcq: 10,
    true_false: 2,
    short: 1,
    essay: 1,
    fill_blank: 0,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const savedDocs = useQuery({
    queryKey: ["ak-documents", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_documents")
        .select("id, title, file_name, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const total = TYPES.reduce((sum, t) => sum + (mix[t] ?? 0), 0);

  const setCount = (type: string, raw: string) => {
    const n = Math.max(0, Math.min(500, Number(raw.replace(/[^\d]/g, "")) || 0));
    setMix((prev) => ({ ...prev, [type]: n }));
  };

  const onPickFile = (picked: File | null) => {
    setFile(picked);
    setSavedDocId("");
    if (picked && !title) setTitle(picked.name.replace(/\.[^.]+$/, ""));
  };

  const onPickSaved = (id: string) => {
    setSavedDocId(id);
    setFile(null);
    const doc = savedDocs.data?.find((d) => d.id === id);
    if (doc) setTitle(doc.title);
  };

  const run = async () => {
    if (!file && !savedDocId && pastedText.trim().length < 40) {
      toast.error("اختر كتابًا محفوظًا أو ارفع ملفًا أو الصق نصًا");
      return;
    }
    if (total < 1) {
      toast.error("حدّد عدد الأسئلة لكل نوع");
      return;
    }

    setBusy(true);
    setProgress(5);
    try {
      let text = pastedText.trim();
      let images: string[] = [];
      let storagePath: string | null = null;
      let documentId: string | null = null;
      let docTitle = title.trim();

      if (savedDocId) {
        setStatus("تحميل الكتاب المحفوظ…");
        const { data: doc, error } = await supabase
          .from("ak_documents")
          .select("id, title, extracted_text")
          .eq("id", savedDocId)
          .single();
        if (error) throw error;
        documentId = doc.id;
        text = doc.extracted_text ?? "";
        docTitle = docTitle || doc.title;
        setProgress(45);
      } else if (file) {
        setStatus("رفع الملف…");
        const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
        const base = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        storagePath = `${user.id}/${Date.now()}-${base || "file"}.${ext.replace(/[^a-z0-9]/g, "")}`;
        const upload = await supabase.storage.from("ak-documents").upload(storagePath, file);
        if (upload.error) throw upload.error;
        setProgress(20);

        setStatus("جاري القراءة…");
        const extracted = await extractFromFile(file, setStatus);
        text = extracted.text.trim();
        images = extracted.images;
        setProgress(40);

        if (!text && images.length) {
          setStatus("قراءة بصرية للصفحات بالذكاء الاصطناعي…");
          const ocr = await runOcr({ data: { images } });
          text = ocr.text.trim();
        }
      }

      if (text.length < 40) {
        throw new Error("لم نتمكن من قراءة نص كافٍ من هذا المحتوى. جرّب ملفًا أوضح.");
      }
      setProgress(55);

      docTitle = docTitle || file?.name || "مستند بدون عنوان";

      if (!documentId) {
        const { data: doc, error: docError } = await supabase
          .from("ak_documents")
          .insert({
            user_id: user.id,
            title: docTitle,
            file_name: file?.name ?? null,
            mime_type: file?.type ?? "text/plain",
            size_bytes: file?.size ?? text.length,
            storage_path: storagePath,
            extracted_text: text,
            status: "ready",
          })
          .select("id")
          .single();
        if (docError) throw docError;
        documentId = doc.id;
      }

      const batches = planBatches(mix);
      const collected: Array<{
        type: string;
        prompt: string;
        options?: string[];
        correct_answer?: string;
        explanation?: string;
        points?: number;
        asset?: unknown;
      }> = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]!;
        setStatus(`توليد الأسئلة… (${collected.length}/${total})`);
        setProgress(55 + Math.round((i / batches.length) * 40));
        const { questions } = await runGenerate({
          data: {
            text,
            count: batch.count,
            difficulty,
            language,
            typeMix: batch.typeMix,
            customPrompt: customPrompt.trim() || undefined,
            avoid: collected.map((q) => q.prompt),
            figureStyle,
          },
        });
        collected.push(...questions);
      }

      if (!collected.length) throw new Error("لم يتم توليد أي سؤال. حاول مرة أخرى.");

      const { data: quiz, error: quizError } = await supabase
        .from("ak_quizzes")
        .insert({
          user_id: user.id,
          document_id: documentId,
          title: `اختبار: ${docTitle}`,
          difficulty,
          language,
          question_count: collected.length,
          type_mix: mix,
          custom_prompt: customPrompt.trim() || null,
          status: "ready",
        })
        .select("id")
        .single();
      if (quizError) throw quizError;

      const { error: qError } = await supabase.from("ak_questions").insert(
        collected.map((q, index) => ({
          user_id: user.id,
          quiz_id: quiz.id,
          order_index: index,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? [],
          correct_answer: q.correct_answer ?? null,
          explanation: q.explanation ?? null,
          points: q.points ?? 1,
          asset: (q.asset ?? null) as never,
        })),
      );
      if (qError) throw qError;

      setProgress(100);
      toast.success(`تم توليد ${collected.length} سؤالًا`);
      router.navigate({ to: "/quiz/$quizId", params: { quizId: quiz.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء المعالجة");
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">اختبار جديد</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر كتابًا رفعته سابقًا، أو ارفع ملفًا جديدًا مرة واحدة فقط — يُحفظ تلقائيًا لكل
            الاختبارات القادمة.
          </p>
        </div>

        <section className="surface-card space-y-4 p-6">
          <h2 className="font-semibold text-foreground">١. المحتوى</h2>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Library className="size-4 text-accent" />
              مكتبتي (كتب وملفات محفوظة)
            </Label>
            <Select value={savedDocId} onValueChange={onPickSaved} disabled={busy}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    savedDocs.isLoading
                      ? "جاري التحميل…"
                      : savedDocs.data?.length
                        ? "اختر كتابًا محفوظًا"
                        : "لا توجد ملفات محفوظة بعد"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(savedDocs.data ?? []).map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savedDocId ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSavedDocId("")}
                className="text-muted-foreground"
              >
                إلغاء الاختيار ورفع ملف جديد
              </Button>
            ) : null}
          </div>

          {savedDocId ? null : (
            <>
              <div className="space-y-2">
                <Label>ملف جديد (PDF, DOCX, TXT, صورة)</Label>
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                  <FileUp className="size-5 text-accent" />
                  {file ? file.name : "اضغط لاختيار ملف"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md,image/*"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <Label>أو الصق النص مباشرة</Label>
                <Textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="الصق محتوى الدرس أو الفصل هنا…"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>عنوان المستند</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </section>

        <section className="surface-card space-y-5 p-6">
          <h2 className="font-semibold text-foreground">٢. إعدادات التوليد</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>مستوى الصعوبة</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="سهل">سهل</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="صعب">صعب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اللغة</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>عدد الأسئلة لكل نوع (بلا حد أعلى)</Label>
              <span className="text-sm font-medium text-accent">المجموع: {total}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">{TYPE_LABELS[type]}</span>
                  <Input
                    className="w-24 text-center"
                    inputMode="numeric"
                    value={String(mix[type] ?? 0)}
                    onChange={(e) => setCount(type, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              الأعداد الكبيرة تُولّد على دفعات تلقائيًا لتجنّب التكرار، وقد تستغرق وقتًا أطول.
            </p>
          </div>

          <FigureStyleFields style={figureStyle} onChange={setFigureStyle} />

          <div className="space-y-2">
            <Label>طلب حر (الذكاء الاصطناعي يلتزم به أولًا)</Label>
            <Textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="مثال: ركّز على الفصل الثالث والمعادلات، واجعل الأسئلة على نمط الوزارة"
            />
          </div>
        </section>

        {busy ? (
          <div className="surface-card space-y-3 p-6">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="size-4 animate-spin text-accent" />
              {status || "جاري العمل…"}
            </div>
            <Progress value={progress} />
          </div>
        ) : null}

        <Button size="lg" className="w-full" disabled={busy} onClick={run}>
          <Sparkles className="size-5" />
          توليد الأسئلة
        </Button>
      </main>
    </div>
  );
}
