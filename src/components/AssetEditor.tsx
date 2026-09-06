import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { QuestionAsset } from "@/components/QuestionAsset";
import { FigureStyleFields } from "@/components/FigureStyleFields";
import { generateFigure } from "@/lib/ai.functions";
import {
  DEFAULT_FIGURE_STYLE,
  applyFigureStyle,
  normalizeAsset,
  sanitizeSvg,
  validateFigureSvg,
  type FigureStyle,
  type QuestionAssetData,
} from "@/lib/question-asset";

/** Shrinks a picked picture and inlines it so it works for guests and in exports. */
async function fileToDataUrl(file: File, maxSide = 1400): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
    reader.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") return raw;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("صيغة الصورة غير مدعومة"));
    el.src = raw;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.9, 0.8, 0.68, 0.55]) {
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length < 2_400_000) return out;
  }
  throw new Error("الصورة كبيرة جدًا، اختر صورة أصغر");
}

const emptyTable = { headers: ["", ""], rows: [["", ""]] };

export function AssetEditor({
  questionPrompt,
  asset,
  onSave,
}: {
  questionPrompt: string;
  asset: unknown;
  onSave: (asset: QuestionAssetData | null) => Promise<void> | void;
}) {
  const current = normalizeAsset(asset);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [tab, setTab] = useState<"image" | "table" | "figure">(
    current?.kind === "table" ? "table" : current?.kind === "image" ? "image" : "figure",
  );
  const [caption, setCaption] = useState(current?.caption ?? "");
  const [dataUrl, setDataUrl] = useState(current?.kind === "image" ? current.dataUrl : "");
  const [svg, setSvg] = useState(current?.kind === "figure" ? current.svg : "");
  const [instruction, setInstruction] = useState("");
  const [style, setStyle] = useState<FigureStyle>(DEFAULT_FIGURE_STYLE);
  const [table, setTable] = useState(
    current?.kind === "table"
      ? { headers: current.headers.length ? current.headers : ["", ""], rows: current.rows }
      : emptyTable,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const runDraw = useServerFn(generateFigure);

  const check = useMemo(() => (svg ? validateFigureSvg(svg) : null), [svg]);

  const preview: QuestionAssetData | null = useMemo(() => {
    const trimmed = caption.trim();
    const cap = trimmed ? { caption: trimmed } : {};
    if (tab === "image") return dataUrl ? { kind: "image", ...cap, dataUrl } : null;
    if (tab === "table") return normalizeAsset({ kind: "table", ...cap, ...table });
    return svg ? normalizeAsset({ kind: "figure", ...cap, svg }) : null;
  }, [tab, caption, dataUrl, table, svg]);

  const pickFile = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      setDataUrl(url);
      setTab("image");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الصورة");
    }
  };

  const draw = async () => {
    setDrawing(true);
    try {
      const { asset: drawn, problems } = await runDraw({
        data: {
          questionPrompt,
          instruction: instruction.trim() || undefined,
          currentSvg: svg || undefined,
          figureStyle: style,
        },
      });
      if (drawn.kind === "figure") {
        setSvg(drawn.svg);
        setTab("figure");
      } else if (drawn.kind === "table") {
        setTable({ headers: drawn.headers, rows: drawn.rows });
        setTab("table");
      }
      if (drawn.caption) setCaption(drawn.caption);
      if (problems.length) toast.warning(`تم الرسم مع ملاحظات: ${problems[0]}`);
      else toast.success("تم رسم شكل مُتحقَّق منه");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر الرسم");
    } finally {
      setDrawing(false);
    }
  };

  const restyle = () => {
    const cleaned = sanitizeSvg(svg);
    if (!cleaned) {
      toast.error("الشكل الحالي غير صالح");
      return;
    }
    setSvg(applyFigureStyle(cleaned, style));
    toast.success("تم تطبيق الألوان والخطوط");
  };

  const commit = async (value: QuestionAssetData | null) => {
    setSaving(true);
    try {
      await onSave(value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <ImagePlus className="size-4" />
          {current ? "تعديل المرفق" : "إضافة صورة/جدول"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مرفق السؤال</DialogTitle>
          <DialogDescription>
            ارفع صورة من جهازك، أو حرّر الجدول، أو اطلب من الذكاء الاصطناعي رسم شكل ثم تحقّق منه
            قبل الاستخدام.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1">
              صورة من عندي
            </TabsTrigger>
            <TabsTrigger value="table" className="flex-1">
              جدول
            </TabsTrigger>
            <TabsTrigger value="figure" className="flex-1">
              شكل مرسوم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3 pt-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" />
              اختيار صورة من الجهاز
            </Button>
            <p className="text-xs text-muted-foreground">
              يتم تصغير الصورة تلقائيًا لتظهر بوضوح في الامتحان الإلكتروني وملفات PDF وWord.
            </p>
          </TabsContent>

          <TabsContent value="table" className="space-y-3 pt-4">
            <div className="space-y-2">
              <Label>رؤوس الأعمدة</Label>
              <div className="flex flex-wrap gap-2">
                {table.headers.map((h, i) => (
                  <Input
                    key={i}
                    className="w-32"
                    value={h}
                    onChange={(e) =>
                      setTable((t) => ({
                        ...t,
                        headers: t.headers.map((v, vi) => (vi === i ? e.target.value : v)),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>الصفوف</Label>
              {table.rows.map((row, ri) => (
                <div key={ri} className="flex flex-wrap gap-2">
                  {row.map((value, ci) => (
                    <Input
                      key={ci}
                      className="w-32"
                      value={value}
                      onChange={(e) =>
                        setTable((t) => ({
                          ...t,
                          rows: t.rows.map((r, rri) =>
                            rri === ri ? r.map((v, vi) => (vi === ci ? e.target.value : v)) : r,
                          ),
                        }))
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTable((t) => ({
                    headers: [...t.headers, ""],
                    rows: t.rows.map((r) => [...r, ""]),
                  }))
                }
              >
                + عمود
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTable((t) => ({ ...t, rows: [...t.rows, t.headers.map(() => "")] }))
                }
              >
                + صف
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setTable((t) => ({
                    headers: t.headers.slice(0, -1),
                    rows: t.rows.map((r) => r.slice(0, -1)),
                  }))
                }
              >
                − عمود
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTable((t) => ({ ...t, rows: t.rows.slice(0, -1) }))}
              >
                − صف
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="figure" className="space-y-4 pt-4">
            <FigureStyleFields style={style} onChange={setStyle} />
            <div className="space-y-2">
              <Label>ماذا تريد أن يظهر في الشكل؟</Label>
              <Textarea
                rows={2}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثال: ارسم دائرة كهربائية ببطارية 12 فولت ومقاومتين متسلسلتين مع القيم"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={draw} disabled={drawing}>
                {drawing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {svg ? "إعادة الرسم" : "رسم الشكل"}
              </Button>
              <Button variant="outline" onClick={restyle} disabled={!svg}>
                <Wand2 className="size-4" />
                تطبيق الألوان والخطوط
              </Button>
            </div>
            <div className="space-y-2">
              <Label>كود الشكل (يمكن تعديله يدويًا)</Label>
              <Textarea
                rows={5}
                dir="ltr"
                className="font-mono text-xs"
                value={svg}
                onChange={(e) => setSvg(e.target.value)}
              />
            </div>
            {check ? (
              check.ok ? (
                <p className="flex items-center gap-2 text-sm text-accent">
                  <CheckCircle2 className="size-4" />
                  الشكل سليم: داخل الإطار، بدون تداخل نصوص، وبتسميات مقروءة.
                </p>
              ) : (
                <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {check.problems.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>وصف المرفق (يظهر تحته)</Label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>

        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">معاينة كما ستظهر للطالب</p>
          {preview ? (
            <QuestionAsset asset={preview} />
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد مرفق بعد</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          {current ? (
            <Button variant="ghost" disabled={saving} onClick={() => commit(null)}>
              <Trash2 className="size-4 text-destructive" />
              حذف المرفق
            </Button>
          ) : null}
          <Button disabled={saving || !preview} onClick={() => commit(preview)}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            حفظ المرفق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
