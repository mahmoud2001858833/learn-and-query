import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
        content: "ارفع ملفًا أو صورة واختر إعدادات التوليد لبناء اختبار بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "اختبار جديد — اسأل كتابك" },
      { property: "og:description", content: "ارفع محتواك وولّد أسئلة فورًا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewQuiz,
});

const TYPES = ["mcq", "true_false", "short", "essay", "fill_blank"] as const;

function NewQuiz() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const runOcr = useServerFn(ocrImages);
  const runGenerate = useServerFn(generateQuestions);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [difficulty, setDifficulty] = useState("متوسط");
  const [language, setLanguage] = useState("ar");
  const [customPrompt, setCustomPrompt] = useState("");
  const [mix, setMix] = useState<Record<string, number>>({
    mcq: 6,
    true_false: 2,
    short: 1,
    essay: 1,
    fill_blank: 0,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const total = TYPES.reduce((sum, t) => sum + (mix[t] ?? 0), 0);

  const onPickFile = (picked: File | null) => {
    setFile(picked);
    if (picked && !title) setTitle(picked.name.replace(/\.[^.]+$/, ""));
  };

  const run = async () => {
    if (!file && pastedText.trim().length < 40) {
      toast.error("ارفع ملفًا أو الصق نصًا كافيًا");
      return;
    }
    if (total < 1) {
      toast.error("اختر عدد الأسئلة لكل نوع");
      return;
    }

    setBusy(true);
    setProgress(5);
    try {
      let text = pastedText.trim();
      let images: string[] = [];
      let storagePath: string | null = null;

      if (file) {
        setStatus("رفع الملف…");
        storagePath = `${user.id}/${Date.now()}-${file.name}`;
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
        throw new Error("لم نتمكن من قراءة نص كافٍ من هذا الملف. جرّب ملفًا أوضح.");
      }
      setProgress(55);

      const docTitle = title.trim() || file?.name || "مستند بدون عنوان";
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

      setStatus("توليد الأسئلة…");
      setProgress(70);
      const { questions } = await runGenerate({
        data: {
          text,
          count: total,
          difficulty,
          language,
          typeMix: mix,
          customPrompt: customPrompt.trim() || undefined,
        },
      });
      if (!questions.length) throw new Error("لم يتم توليد أي سؤال. حاول مرة أخرى.");

      const { data: quiz, error: quizError } = await supabase
        .from("ak_quizzes")
        .insert({
          user_id: user.id,
          document_id: doc.id,
          title: `اختبار: ${docTitle}`,
          difficulty,
          language,
          question_count: questions.length,
          type_mix: mix,
          custom_prompt: customPrompt.trim() || null,
          status: "ready",
        })
        .select("id")
        .single();
      if (quizError) throw quizError;

      const { error: qError } = await supabase.from("ak_questions").insert(
        questions.map((q, index) => ({
          user_id: user.id,
          quiz_id: quiz.id,
          order_index: index,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? [],
          correct_answer: q.correct_answer ?? null,
          explanation: q.explanation ?? null,
          points: q.points ?? 1,
        })),
      );
      if (qError) throw qError;

      setProgress(100);
      toast.success("تم توليد الاختبار بنجاح");
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
            ارفع كتابًا أو ملفًا أو صورة، أو الصق نصًا، ثم حدّد إعدادات الأسئلة.
          </p>
        </div>

        <section className="surface-card space-y-4 p-6">
          <h2 className="font-semibold text-foreground">١. المحتوى</h2>
          <div className="space-y-2">
            <Label>الملف (PDF, DOCX, TXT, صورة)</Label>
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
            <Label>عنوان المستند</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>عدد الأسئلة لكل نوع</Label>
              <span className="text-sm font-medium text-accent">المجموع: {total}</span>
            </div>
            {TYPES.map((type) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{TYPE_LABELS[type]}</span>
                  <span className="text-muted-foreground">{mix[type] ?? 0}</span>
                </div>
                <Slider
                  dir="rtl"
                  min={0}
                  max={15}
                  step={1}
                  value={[mix[type] ?? 0]}
                  onValueChange={([v]) => setMix((prev) => ({ ...prev, [type]: v ?? 0 }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>طلب حر (اختياري)</Label>
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="مثال: ركّز على الفصل الثالث والمصطلحات"
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
