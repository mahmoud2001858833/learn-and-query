import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  FileText,
  ListChecks,
  Sparkles,
  Upload,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اسأل كتابك — حوّل أي كتاب إلى أسئلة واختبارات" },
      {
        name: "description",
        content:
          "ارفع كتابًا أو ملفًا أو صورًا، والذكاء الاصطناعي يقرأ المحتوى ويولّد أسئلة متنوعة قابلة للحل إلكترونيًا أو التصدير PDF و Word.",
      },
      { property: "og:title", content: "اسأل كتابك — حوّل أي كتاب إلى أسئلة" },
      {
        property: "og:description",
        content: "توليد أسئلة ذكية من أي ملف، مع تصحيح فوري وتصدير PDF و Word.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Upload,
    title: "ارفع المحتوى",
    body: "PDF، Word، صور ممسوحة ضوئيًا أو نص مباشر. المنصة تقرأ الكل حتى الصور بالتعرّف البصري.",
  },
  {
    icon: Sparkles,
    title: "اطلب أسئلتك",
    body: "حدّد العدد، الصعوبة، اللغة، ونسبة كل نوع، أو اكتب طلبًا حرًا مثل: ركّز على الفصل الثالث.",
  },
  {
    icon: ListChecks,
    title: "حل أو صدّر",
    body: "حل الاختبار إلكترونيًا مع تصحيح فوري وشرح لكل سؤال، أو صدّره PDF و Word بنسخة أسئلة وأخرى إجابات.",
  },
];

const features = [
  "اختيار من متعدد، صح/خطأ، إجابة قصيرة، مقالي، وإكمال الفراغ",
  "تصحيح فوري للدرجة مع شرح لكل سؤال",
  "تصحيح الأسئلة المقالية بالذكاء الاصطناعي مع تعليق",
  "تعديل أو حذف أو إعادة توليد أي سؤال",
  "سجل كامل لملفاتك واختباراتك ونتائجك",
  "تصدير PDF و Word بدعم كامل للعربية",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="flex items-center gap-2 font-semibold">
          <BookOpenCheck className="size-6 text-accent" />
          اسأل كتابك
        </span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">تسجيل الدخول</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <Sparkles className="size-4" />
            مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-6xl">
            حوّل أي كتاب أو ملف إلى
            <span className="text-accent"> أسئلة واختبارات</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            يقرأ الذكاء الاصطناعي محتواك بالتفصيل، ثم يبني لك أسئلة بأنواع مختلفة تحلّها
            إلكترونيًا بتصحيح فوري أو تصدّرها PDF و Word.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">ابدأ الآن مجانًا</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">لدي حساب</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <article key={step.title} className="surface-card p-6 text-right">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    الخطوة {i + 1}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="surface-card grid gap-8 p-8 md:grid-cols-2 md:p-10">
            <div>
              <h2 className="text-2xl font-bold text-foreground">كل ما تحتاجه لبناء اختبار</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                أدوات متكاملة من قراءة الملف حتى ورقة الإجابات النموذجية.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                  <FileText className="size-4 text-accent" /> قراءة PDF و Word والصور
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                  <FileDown className="size-4 text-accent" /> تصدير PDF و Word
                </span>
              </div>
            </div>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        اسأل كتابك — منصة توليد الأسئلة بالذكاء الاصطناعي
      </footer>
    </div>
  );
}
