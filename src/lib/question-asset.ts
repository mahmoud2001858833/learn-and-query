// Shared model for a visual attachment that belongs to a question:
// a data table, a drawn figure (inline SVG), or an uploaded picture.

export type TableAsset = {
  kind: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
};

export type FigureAsset = {
  kind: "figure";
  caption?: string;
  svg: string;
};

export type ImageAsset = {
  kind: "image";
  caption?: string;
  /** Inlined picture (data:image/...;base64,...) so it works offline, for guests and in exports. */
  dataUrl: string;
};

export type QuestionAssetData = TableAsset | FigureAsset | ImageAsset;

const MAX_SVG = 20000;
const MAX_IMAGE_CHARS = 2_600_000; // ≈ 1.9MB binary

export const FIGURE_WIDTH = 480;
export const FIGURE_HEIGHT = 320;

/** Visual preferences the user picks before generating (colors, fonts, corners, lines). */
export type FigureStyle = {
  palette: "classic" | "print" | "vivid";
  fontScale: number; // 1 = as drawn, 1.15 = larger labels
  strokeWidth: number; // minimum line thickness
  rounded: boolean; // rounded vs. sharp corners
};

export const DEFAULT_FIGURE_STYLE: FigureStyle = {
  palette: "classic",
  fontScale: 1,
  strokeWidth: 2,
  rounded: true,
};

export const FIGURE_PALETTES: Record<
  FigureStyle["palette"],
  { label: string; stroke: string; accent: string; alt: string; text: string; fill: string }
> = {
  classic: {
    label: "أزرق كلاسيكي",
    stroke: "#1e3a8a",
    accent: "#0f9b78",
    alt: "#b45309",
    text: "#111827",
    fill: "#eaf1ff",
  },
  print: {
    label: "طباعة أبيض وأسود",
    stroke: "#111827",
    accent: "#374151",
    alt: "#6b7280",
    text: "#111827",
    fill: "#f3f4f6",
  },
  vivid: {
    label: "ملوّن تعليمي",
    stroke: "#1d4ed8",
    accent: "#0f9b78",
    alt: "#b91c1c",
    text: "#0f172a",
    fill: "#fff7ed",
  },
};

const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "rect",
  "line",
  "circle",
  "ellipse",
  "path",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "marker",
  "title",
]);

/** Removes anything scriptable or remote from a model-produced SVG. */
export function sanitizeSvg(raw: string): string | null {
  if (typeof raw !== "string") return null;
  let svg = raw.trim();
  const start = svg.indexOf("<svg");
  const end = svg.lastIndexOf("</svg>");
  if (start === -1 || end === -1) return null;
  svg = svg.slice(start, end + 6);
  if (svg.length > MAX_SVG) return null;

  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<image\b[^>]*\/?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s(?:xlink:)?href\s*=\s*"(?!#)[^"]*"/gi, "")
    .replace(/javascript:/gi, "");

  if (!/^<svg[\s>]/i.test(svg)) return null;

  // Extract the opening tag so we can normalize it (responsive + readable text).
  const openEnd = svg.indexOf(">");
  if (openEnd === -1) return null;
  let open = svg.slice(0, openEnd + 1);
  let rest = svg.slice(openEnd + 1);

  // Fixed pixel sizes break responsive layout in the app, PDF and Word exports.
  open = open.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  if (!/viewBox\s*=/i.test(open)) {
    open = open.replace(/^<svg/i, `<svg viewBox="0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}"`);
  }
  if (!/xmlns\s*=/i.test(open)) {
    open = open.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  // Arabic labels need a real font stack and RTL shaping to render correctly.
  if (!/font-family\s*=/i.test(open)) {
    open = open.replace(
      /^<svg/i,
      '<svg font-family="IBM Plex Sans Arabic, Segoe UI, Tahoma, sans-serif"',
    );
  }

  // A white plate keeps the figure legible on dark UI and in PDF/Word.
  if (!/<rect[^>]*fill\s*=\s*"#f{3,6}"/i.test(rest)) {
    rest = `<rect x="0" y="0" width="${FIGURE_WIDTH}" height="${FIGURE_HEIGHT}" fill="#ffffff"/>${rest}`;
  }

  svg = open + rest;

  // Bump unreadably small label sizes produced by the model.
  svg = svg.replace(/font-size\s*=\s*"(\d+(?:\.\d+)?)(px)?"/gi, (match, size: string) => {
    const n = Number(size);
    if (n < 13) return 'font-size="14"';
    if (n > 26) return 'font-size="22"';
    return match;
  });

  return svg;
}

/** Applies the user's visual preferences (palette, label size, lines, corners). */
export function applyFigureStyle(svg: string, style: FigureStyle): string {
  const palette = FIGURE_PALETTES[style.palette] ?? FIGURE_PALETTES.classic;
  let out = svg;

  // Map every non-white colour onto the chosen palette so figures stay coherent.
  out = out.replace(/(stroke|fill)\s*=\s*"([^"]+)"/gi, (match, attr: string, value: string) => {
    const v = value.trim().toLowerCase();
    if (v === "none" || v === "transparent" || /^#f{3}$|^#f{6}$|^white$/.test(v)) return match;
    if (attr.toLowerCase() === "stroke") return `stroke="${palette.stroke}"`;
    // Text keeps a dark ink colour; shapes get a soft fill.
    return `fill="${isLightColor(v) ? palette.fill : palette.accent}"`;
  });
  out = out.replace(/<text([^>]*)>/gi, (m, attrs: string) => {
    const cleaned = String(attrs).replace(/\sfill\s*=\s*"[^"]*"/gi, "");
    return `<text${cleaned} fill="${palette.text}">`;
  });

  // Minimum line thickness.
  out = out.replace(/stroke-width\s*=\s*"(\d+(?:\.\d+)?)"/gi, (m, w: string) =>
    Number(w) < style.strokeWidth ? `stroke-width="${style.strokeWidth}"` : m,
  );

  // Label size scale.
  if (style.fontScale !== 1) {
    out = out.replace(/font-size\s*=\s*"(\d+(?:\.\d+)?)(px)?"/gi, (_m, size: string) => {
      const scaled = Math.min(24, Math.max(12, Math.round(Number(size) * style.fontScale)));
      return `font-size="${scaled}"`;
    });
  }

  // Corner treatment on rectangles.
  out = out.replace(/<rect\b([^>]*)>/gi, (m, attrs: string) => {
    let a = String(attrs).replace(/\s(rx|ry)\s*=\s*"[^"]*"/gi, "");
    if (style.rounded && !/width\s*=\s*"480"/i.test(a)) a += ' rx="6" ry="6"';
    return `<rect${a}>`;
  });

  return out;
}

function isLightColor(value: string): boolean {
  const hex = value.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return false;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 > 190;
}

type TextBox = { x: number; y: number; w: number; h: number };

/** Structural + layout checks on a figure before it is ever shown to a student. */
export function validateFigureSvg(svg: string): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (!svg || !/^<svg[\s>]/i.test(svg.trim())) {
    return { ok: false, problems: ["الشكل غير صالح أو فارغ"] };
  }

  // Tags: only the safe drawing set, and containers must be balanced.
  const tags = [...svg.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/g)].map((m) => m[1]!.toLowerCase());
  const unknown = [...new Set(tags.filter((t) => !ALLOWED_TAGS.has(t)))];
  if (unknown.length) problems.push(`عناصر غير مسموحة: ${unknown.join(", ")}`);

  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g)) {
    const closing = m[1] === "/";
    const tag = m[2]!.toLowerCase();
    const selfClosing = /\/\s*$/.test(m[3] ?? "");
    if (!["svg", "g", "text", "defs", "marker", "title", "tspan"].includes(tag)) continue;
    if (closing) {
      if (stack.pop() !== tag) problems.push("وسوم الشكل غير مغلقة بشكل صحيح");
    } else if (!selfClosing) stack.push(tag);
  }
  if (stack.length) problems.push("وسوم الشكل غير مغلقة بشكل صحيح");

  const shapes = tags.filter((t) =>
    ["rect", "line", "circle", "ellipse", "path", "polyline", "polygon"].includes(t),
  ).length;
  if (shapes < 2) problems.push("الشكل فقير جدًا (أقل من عنصرين مرسومين)");

  // Everything must fit inside the 480×320 frame.
  const outOfBounds = [...svg.matchAll(/\b(x|y|cx|cy|x1|y1|x2|y2)\s*=\s*"(-?\d+(?:\.\d+)?)"/g)].some(
    (m) => {
      const value = Number(m[2]);
      const vertical = /y/.test(m[1]!);
      return value < -8 || value > (vertical ? FIGURE_HEIGHT : FIGURE_WIDTH) + 8;
    },
  );
  if (outOfBounds) problems.push("توجد عناصر خارج حدود إطار الشكل");

  // Labels: short, readable, non-overlapping.
  const boxes: TextBox[] = [];
  for (const m of svg.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/gi)) {
    const attrs = m[1] ?? "";
    const content = (m[2] ?? "").replace(/<[^>]*>/g, "").trim();
    if (!content) continue;
    if (content.length > 26) problems.push(`نص طويل داخل الشكل: «${content.slice(0, 20)}…»`);
    const size = Number(/font-size\s*=\s*"(\d+(?:\.\d+)?)/.exec(attrs)?.[1] ?? 14);
    if (size < 12) problems.push("حجم خط بعض التسميات صغير جدًا");
    if (/rotate\s*\(/i.test(attrs)) problems.push("لا تُدوّر النصوص داخل الشكل");
    const x = Number(/\bx\s*=\s*"(-?\d+(?:\.\d+)?)/.exec(attrs)?.[1] ?? 0);
    const y = Number(/\by\s*=\s*"(-?\d+(?:\.\d+)?)/.exec(attrs)?.[1] ?? 0);
    const anchor = /text-anchor\s*=\s*"(middle|end)"/.exec(attrs)?.[1];
    const w = content.length * size * 0.58;
    const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    boxes.push({ x: left, y: y - size, w, h: size * 1.2 });
  }

  let overlaps = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const ow = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ow > 3 && oh > 3) overlaps++;
    }
  }
  if (overlaps > 0) problems.push(`تسميات متداخلة (${overlaps} تداخل) — أعد توزيع النصوص`);

  return { ok: problems.length === 0, problems };
}

const cell = (value: unknown) => String(value ?? "").slice(0, 300);

function normalizeDataUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i.test(url)) {
    return null;
  }
  if (url.length > MAX_IMAGE_CHARS) return null;
  return url.replace(/\s+/g, "");
}

/** Validates/normalizes an asset coming from the AI, the user, or the database. */
export function normalizeAsset(value: unknown): QuestionAssetData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const caption = typeof raw["caption"] === "string" ? raw["caption"].slice(0, 300) : undefined;

  if (raw["kind"] === "image" || typeof raw["dataUrl"] === "string") {
    const dataUrl = normalizeDataUrl(raw["dataUrl"]);
    if (!dataUrl) return null;
    return { kind: "image", ...(caption ? { caption } : {}), dataUrl };
  }

  if (raw["kind"] === "table" || Array.isArray(raw["rows"])) {
    const headers = Array.isArray(raw["headers"]) ? raw["headers"].map(cell) : [];
    const rows = Array.isArray(raw["rows"])
      ? raw["rows"]
          .filter((row): row is unknown[] => Array.isArray(row))
          .map((row) => row.map(cell))
          .slice(0, 30)
      : [];
    if (!rows.length && headers.length < 2) return null;
    const width = Math.max(headers.length, ...rows.map((r) => r.length), 1);
    return {
      kind: "table",
      ...(caption ? { caption } : {}),
      headers: headers.length ? Array.from({ length: width }, (_, i) => headers[i] ?? "") : [],
      rows: rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? "")),
    };
  }

  if (raw["kind"] === "figure" || typeof raw["svg"] === "string") {
    const svg = sanitizeSvg(String(raw["svg"] ?? ""));
    if (!svg) return null;
    return { kind: "figure", ...(caption ? { caption } : {}), svg };
  }

  return null;
}
