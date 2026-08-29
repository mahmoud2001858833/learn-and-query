import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyQuizLinkButton({
  quizId,
  size = "sm",
  variant = "outline",
  label = "نسخ رابط الامتحان",
}: {
  quizId: string;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "secondary" | "ghost" | "default";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/solve/${quizId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        el.remove();
      }
      setCopied(true);
      toast.success("تم نسخ رابط الامتحان الإلكتروني");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر النسخ — الرابط: " + url);
    }
  };

  return (
    <Button type="button" size={size} variant={variant} onClick={copy}>
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? "تم النسخ" : label}
    </Button>
  );
}
