import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, ListChecks, PenLine, PlayCircle, Trophy } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CopyQuizLinkButton } from "@/components/CopyQuizLinkButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة الحساب — اسأل كتابك" },
      { name: "description", content: "ملفاتك واختباراتك ونتائجك السابقة في مكان واحد." },
      { property: "og:title", content: "لوحة الحساب — اسأل كتابك" },
      { property: "og:description", content: "تابع ملفاتك واختباراتك ونتائجك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

  const documents = useQuery({
    queryKey: ["ak-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_documents")
        .select("id, title, status, created_at, mime_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const quizzes = useQuery({
    queryKey: ["ak-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_quizzes")
        .select("id, title, difficulty, question_count, created_at, document_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const attempts = useQuery({
    queryKey: ["ak-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ak_attempts")
        .select("id, quiz_id, score, max_score, submitted_at, ak_quizzes(title)")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة الحساب</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ملفاتك المرفوعة، الاختبارات المولّدة منها، ونتائجك.
            </p>
          </div>
          <Button asChild>
            <Link to="/new">رفع ملف وتوليد أسئلة</Link>
          </Button>
        </div>

        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <ListChecks className="size-5 text-accent" />
            اختباراتي
          </h2>
          {quizzes.isLoading ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : quizzes.data?.length ? (
            <ul className="mt-4 divide-y divide-border">
              {quizzes.data.map((quiz) => (
                <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {quiz.question_count} سؤال · صعوبة {quiz.difficulty} ·{" "}
                      {new Date(quiz.created_at).toLocaleDateString("ar")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyQuizLinkButton quizId={quiz.id} />
                    <Button asChild size="sm" variant="outline">
                      <Link to="/quiz/$quizId" params={{ quizId: quiz.id }}>
                        <PenLine className="size-4" />
                        تحرير وتصدير
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link to="/solve/$quizId" params={{ quizId: quiz.id }}>
                        <PlayCircle className="size-4" />
                        حل
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              لا توجد اختبارات بعد. ابدأ برفع ملف.
            </p>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <FileText className="size-5 text-accent" />
              ملفاتي
            </h2>
            {documents.isLoading ? (
              <Skeleton className="mt-4 h-16 w-full" />
            ) : documents.data?.length ? (
              <ul className="mt-4 space-y-3">
                {documents.data.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{doc.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {doc.status === "ready" ? "جاهز" : doc.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">لم ترفع أي ملف بعد.</p>
            )}
          </section>

          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Trophy className="size-5 text-accent" />
              نتائجي السابقة
            </h2>
            {attempts.isLoading ? (
              <Skeleton className="mt-4 h-16 w-full" />
            ) : attempts.data?.length ? (
              <ul className="mt-4 space-y-3">
                {attempts.data.map((attempt) => (
                  <li key={attempt.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleString("ar")
                        : ""}
                    </span>
                    <span className="font-semibold text-foreground">
                      {attempt.score} / {attempt.max_score}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">لا توجد محاولات مكتملة بعد.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
