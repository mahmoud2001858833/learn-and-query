import { Link, useRouter } from "@tanstack/react-router";
import { BookOpenCheck, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({ email }: { email?: string | null | undefined }) {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
          <BookOpenCheck className="size-6 text-accent" />
          اسأل كتابك
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/new">
              <Plus className="size-4" />
              اختبار جديد
            </Link>
          </Button>
          {email ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>
      </div>
    </header>
  );
}
