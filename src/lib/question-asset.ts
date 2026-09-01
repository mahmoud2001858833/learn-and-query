// Shared model for a visual attachment that belongs to a question:
// either a data table or a drawn figure (inline SVG).

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

export type QuestionAssetData = TableAsset | FigureAsset;

const MAX_SVG = 20000;

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
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s(?:xlink:)?href\s*=\s*"(?!#)[^"]*"/gi, "")
    .replace(/javascript:/gi, "");

  if (!/^<svg[\s>]/i.test(svg)) return null;
  if (!/viewBox\s*=/i.test(svg)) {
    svg = svg.replace(/^<svg/i, '<svg viewBox="0 0 400 260"');
  }
  return svg;
}

const cell = (value: unknown) => String(value ?? "").slice(0, 300);

/** Validates/normalizes an asset coming from the AI or the database. */
export function normalizeAsset(value: unknown): QuestionAssetData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const caption = typeof raw["caption"] === "string" ? raw["caption"].slice(0, 300) : undefined;

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
      headers: headers.length
        ? Array.from({ length: width }, (_, i) => headers[i] ?? "")
        : [],
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
