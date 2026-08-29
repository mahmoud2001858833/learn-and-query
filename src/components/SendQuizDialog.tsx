import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { sendQuizToAccount } from "@/lib/share.functions";

export function SendQuizDialog({
  quizId,
  size = "sm",
  variant = "outline",
}: {
  quizId: string;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "ghost" | "default";
}) {
  const run = useServerFn(sendQuizToAccount);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"copy" | "move">("copy");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await run({ data: { quizId, email, mode } });
      toast.success(
        result.mode === "move"
          ? `تم نقل الاختبار (${result.questions} سؤال) إلى ${email}`
          : `تم إرسال نسخة من الاختبار (${result.questions} سؤال) إلى ${email}`,
      );
      setOpen(false);
      setEmail("");
      await queryClient.invalidateQueries();
      if (result.mode === "move") navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر الإرسال");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size={size} variant={variant}>
          <Send className="size-4" />
          إرسال لحساب آخر
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="text-right">
        <DialogHeader className="text-right">
          <DialogTitle>إرسال الاختبار إلى حساب آخر</DialogTitle>
          <DialogDescription>
            اكتب بريد الحساب المستهدف — سيظهر الاختبار في لوحته كأنه أنشأه بنفسه، ويمكنه تحريره
            وتصديره وحلّه.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="send-email">بريد الحساب</Label>
            <Input
              id="send-email"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as "copy" | "move")}
            className="space-y-2"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value="copy" id="mode-copy" className="mt-1" />
              <Label htmlFor="mode-copy" className="font-normal leading-relaxed">
                إرسال نسخة — يبقى الاختبار عندي أيضًا
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="move" id="mode-move" className="mt-1" />
              <Label htmlFor="mode-move" className="font-normal leading-relaxed">
                نقل نهائي — يُحذف من حسابي وينتقل إليه
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={busy || !email.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {mode === "move" ? "نقل الاختبار" : "إرسال نسخة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
