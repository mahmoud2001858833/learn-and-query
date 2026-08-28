import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — اسأل كتابك" },
      {
        name: "description",
        content: "سجّل الدخول أو أنشئ حسابًا لتوليد أسئلة من كتبك وملفاتك بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "تسجيل الدخول — اسأل كتابك" },
      { property: "og:description", content: "حسابك في منصة توليد الأسئلة بالذكاء الاصطناعي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  const handle = async (mode: "in" | "up") => {
    if (!email || password.length < 6) {
      toast.error("أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب بنجاح");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) router.navigate({ to: "/dashboard" });
      else toast.info("تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول");
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذّر إتمام العملية";
      toast.error(
        message.includes("Invalid login")
          ? "البريد أو كلمة المرور غير صحيحة"
          : message.includes("already registered")
            ? "هذا البريد مسجّل مسبقًا، سجّل الدخول"
            : message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <BookOpenCheck className="size-6 text-accent" />
          اسأل كتابك
        </Link>

        <div className="surface-card p-6">
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="up">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="in" className="mt-6 space-y-4">
              <Field label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" />
              <Field
                label="كلمة المرور"
                value={password}
                onChange={setPassword}
                type="password"
              />
              <Button className="w-full" disabled={loading} onClick={() => handle("in")}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                دخول
              </Button>
            </TabsContent>

            <TabsContent value="up" className="mt-6 space-y-4">
              <Field label="الاسم الكامل" value={fullName} onChange={setFullName} />
              <Field label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" />
              <Field
                label="كلمة المرور"
                value={password}
                onChange={setPassword}
                type="password"
              />
              <Button className="w-full" disabled={loading} onClick={() => handle("up")}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                إنشاء الحساب
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" />
    </div>
  );
}
