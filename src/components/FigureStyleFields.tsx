import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIGURE_PALETTES, type FigureStyle } from "@/lib/question-asset";

/** Colour / font / line / corner controls for AI-drawn figures. */
export function FigureStyleFields({
  style,
  onChange,
}: {
  style: FigureStyle;
  onChange: (style: FigureStyle) => void;
}) {
  const set = (patch: Partial<FigureStyle>) => onChange({ ...style, ...patch });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-sm font-medium text-foreground">هيئة الأشكال والصور المولّدة</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>الألوان</Label>
          <Select
            value={style.palette}
            onValueChange={(v) => set({ palette: v as FigureStyle["palette"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIGURE_PALETTES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>حجم الخطوط داخل الشكل</Label>
          <Select value={String(style.fontScale)} onValueChange={(v) => set({ fontScale: Number(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.9">صغير</SelectItem>
              <SelectItem value="1">متوسط</SelectItem>
              <SelectItem value="1.15">كبير</SelectItem>
              <SelectItem value="1.3">كبير جدًا</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>سماكة الخطوط</Label>
          <Select
            value={String(style.strokeWidth)}
            onValueChange={(v) => set({ strokeWidth: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.5">رفيعة</SelectItem>
              <SelectItem value="2">عادية</SelectItem>
              <SelectItem value="3">سميكة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 pt-6">
          <Label htmlFor="fig-rounded" className="text-sm text-muted-foreground">
            زوايا مستديرة
          </Label>
          <Switch
            id="fig-rounded"
            checked={style.rounded}
            onCheckedChange={(v) => set({ rounded: v })}
          />
        </div>
      </div>
    </div>
  );
}
