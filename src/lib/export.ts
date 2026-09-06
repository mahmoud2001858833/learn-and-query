// Export a quiz to .docx (questions sheet + answer key) and to a downloadable PDF.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import {
  normalizeAsset,
  type FigureAsset,
  type QuestionAssetData,
  type TableAsset,
} from "./question-asset";

export type ExportQuestion = {
  position: number;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  asset?: unknown;
};

export const TYPE_LABELS: Record<string, string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح / خطأ",
  short: "إجابة قصيرة",
  essay: "مقالي",
  fill_blank: "إكمال الفراغ",
};

const rtl = { bidirectional: true, alignment: AlignmentType.RIGHT } as const;

function heading(text: string) {
  return new Paragraph({
    ...rtl,
    spacing: { after: 240 },
    children: [new TextRun({ text, bold: true, size: 32, rightToLeft: true })],
  });
}

function line(text: string, bold = false) {
  return new Paragraph({
    ...rtl,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, size: 24, rightToLeft: true })],
  });
}

/** Decodes an inlined picture into bytes + display size for Word. */
async function imageForDocx(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const size = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 400, h: 260 });
    img.src = dataUrl;
  });
  const width = Math.min(420, size.w);
  const height = Math.round((width * size.h) / (size.w || 1));
  const type = /png/i.test(meta ?? "") ? ("png" as const) : ("jpg" as const);
  return { bytes, width, height, type };
}

async function docxAsset(asset: QuestionAssetData): Promise<(Paragraph | Table)[]> {
  if (asset.kind === "image") {
    try {
      const { bytes, width, height, type } = await imageForDocx(asset.dataUrl);
      const picture = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({ data: bytes, type, transformation: { width, height } }),
        ],
      });
      return asset.caption ? [picture, line(`   ${asset.caption}`)] : [picture];
    } catch {
      return [line("   [صورة مرفقة — انظر نسخة PDF]")];
    }
  }
  return docxNonImageAsset(asset);
}

function docxNonImageAsset(asset: TableAsset | FigureAsset): (Paragraph | Table)[] {
  if (asset.kind === "table") {
    const rows = asset.headers.some((h) => h.trim())
      ? [asset.headers, ...asset.rows]
      : asset.rows;
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      visuallyRightToLeft: true,
      rows: rows.map(
        (row, ri) =>
          new TableRow({
            children: row.map(
              (value) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      ...rtl,
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: value, bold: ri === 0, size: 22, rightToLeft: true }),
                      ],
                    }),
                  ],
                }),
            ),
          }),
      ),
    });
    return asset.caption ? [line(`   ${asset.caption}`), table, line("")] : [table, line("")];
  }
  return [line(`   [شكل توضيحي: ${asset.caption ?? "انظر نسخة PDF"}]`)];
}

export async function exportQuizDocx(
  title: string,
  questions: ExportQuestion[],
  withAnswers: boolean,
  branding = true,
) {
  const body: (Paragraph | Table)[] = [heading(withAnswers ? `${title} — ورقة الإجابات` : title)];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    body.push(line(`${i + 1}. ${q.prompt}  (${TYPE_LABELS[q.type] ?? q.type})`, true));
    const asset = normalizeAsset(q.asset);
    if (asset) body.push(...(await docxAsset(asset)));
    (q.options ?? []).forEach((opt, oi) => {
      body.push(line(`   ${String.fromCharCode(1571 + oi)}) ${opt}`));
    });
    if (withAnswers) {
      body.push(line(`   الإجابة الصحيحة: ${q.correct_answer ?? "—"}`));
      if (q.explanation) body.push(line(`   الشرح: ${q.explanation}`));
    } else if (q.type === "short" || q.type === "essay") {
      body.push(line("   ......................................................"));
    }
    body.push(line(""));
  }

  if (branding) body.push(line("أُنشئت بواسطة منصة اسأل كتابك"));

  const doc = new Document({ sections: [{ children: body }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}${withAnswers ? "-الإجابات" : "-الأسئلة"}.docx`);
}


const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

/** Builds an isolated iframe document containing only the sheet CSS.
 *  html2canvas cannot parse oklch() colors used by the app's Tailwind theme,
 *  so the sheet must render in a clean document without app stylesheets. */
async function renderInIsolatedFrame(html: string): Promise<{
  element: HTMLElement;
  cleanup: () => void;
}> {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:-20000px;width:900px;height:1200px;border:0;z-index:-1";
  iframe.srcdoc = `<!DOCTYPE html><html dir="rtl" lang="ar"><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<style>html,body{margin:0;padding:0;background:#fff}${SHEET_CSS}</style>
</head><body>${html}</body></html>`;
  document.body.appendChild(iframe);

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 3000);
  });

  const doc = iframe.contentDocument!;
  if (doc.fonts?.ready) await doc.fonts.ready.catch(() => undefined);
  await new Promise((r) => setTimeout(r, 350));

  const element = doc.querySelector<HTMLElement>(".sheet");
  if (!element) {
    iframe.remove();
    throw new Error("تعذّر تجهيز ورقة التصدير");
  }
  return { element, cleanup: () => iframe.remove() };
}

function buildSheetHtml(
  title: string,
  questions: ExportQuestion[],
  withAnswers: boolean,
  branding: boolean,
) {
  const today = new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(new Date());
  const counts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([t, n]) => `<span class="chip">${TYPE_LABELS[t] ?? t} · ${n}</span>`)
    .join("");

  const blocks = questions
    .map((q, i) => {
      const options = (q.options ?? [])
        .map(
          (o, oi) =>
            `<div class="opt"><span class="mark">${ARABIC_LETTERS[oi] ?? oi + 1}</span><span>${escapeHtml(
              o,
            )}</span></div>`,
        )
        .join("");
      const asset = assetHtml(normalizeAsset(q.asset));
      const blank =
        !withAnswers && (q.type === "short" || q.type === "essay")
          ? `<div class="lines"><div></div><div></div><div></div></div>`
          : "";
      const answer = withAnswers
        ? `<div class="ans"><b>الإجابة:</b> ${escapeHtml(q.correct_answer ?? "—")}</div>`
        : "";
      const why =
        withAnswers && q.explanation
          ? `<div class="exp"><b>الشرح:</b> ${escapeHtml(q.explanation)}</div>`
          : "";
      return `<section class="q">
  <div class="qhead"><span class="num">${i + 1}</span><div class="prompt">${escapeHtml(
    q.prompt,
  )}</div><span class="tag">${TYPE_LABELS[q.type] ?? q.type}</span></div>
  ${asset}
  ${options ? `<div class="opts">${options}</div>` : ""}
  ${blank}${answer}${why}
</section>`;
    })
    .join("");

  return `<div class="sheet">
  <header class="hero">
    <div class="bar"></div>
    <h1>${escapeHtml(title)}${withAnswers ? " — نموذج الإجابات" : ""}</h1>
    <div class="meta"><span>${questions.length} سؤالًا</span><span class="dot"></span><span>${today}</span></div>
    <div class="chips">${summary}</div>
    ${
      withAnswers
        ? ""
        : `<div class="fields"><span>الاسم: ..............................</span><span>الصف: ................</span><span>الدرجة: ......../${questions.length}</span></div>`
    }
  </header>
  ${blocks}
  <footer class="foot">${
    branding ? "أُنشئت بواسطة منصة اسأل كتابك" : "&nbsp;"
  }</footer>
</div>`;
}


function assetHtml(asset: QuestionAssetData | null): string {
  if (!asset) return "";
  const caption = asset.caption
    ? `<div class="cap">${escapeHtml(asset.caption)}</div>`
    : "";
  if (asset.kind === "image") {
    return `<div class="asset"><div class="fig"><img src="${asset.dataUrl}" alt="" /></div>${caption}</div>`;
  }
  if (asset.kind === "table") {
    const head = asset.headers.some((h) => h.trim())
      ? `<thead><tr>${asset.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`
      : "";
    const body = asset.rows
      .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="asset"><table class="tbl">${head}<tbody>${body}</tbody></table>${caption}</div>`;
  }
  // SVG is sanitized by normalizeAsset before it reaches the sheet.
  return `<div class="asset"><div class="fig">${asset.svg}</div>${caption}</div>`;
}

const SHEET_CSS = `
.sheet{font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;direction:rtl;background:#fff;color:#1b2542;width:794px;box-sizing:border-box;padding:48px 54px;line-height:1.95}
.sheet .hero{margin-bottom:26px;padding:22px 24px;border:1px solid #e6eaf4;border-radius:16px;background:#f9fbff}
.sheet .bar{height:5px;width:120px;border-radius:99px;background:linear-gradient(90deg,#1e3a8a,#0f9b78);margin-bottom:16px}
.sheet h1{font-size:27px;font-weight:700;margin:0 0 10px;color:#111c3a;letter-spacing:-0.2px}
.sheet .meta{display:flex;align-items:center;gap:10px;font-size:12.5px;color:#0f9b78;font-weight:600}
.sheet .dot{width:4px;height:4px;border-radius:99px;background:#c3cbe0}
.sheet .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.sheet .chip{font-size:11px;color:#39415e;background:#fff;border:1px solid #e0e6f3;border-radius:99px;padding:3px 10px}
.sheet .fields{display:flex;gap:18px;font-size:12.5px;color:#39415e;margin-top:16px;padding:11px 14px;border:1px dashed #ccd5ea;border-radius:12px;background:#fff}
.sheet .q{padding:18px 0;border-top:1px solid #edf0f8;break-inside:avoid}
.sheet .qhead{display:flex;align-items:flex-start;gap:10px}
.sheet .num{flex:0 0 27px;height:27px;border-radius:9px;background:#1e3a8a;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}
.sheet .prompt{flex:1;font-size:16px;font-weight:600;color:#141d38}
.sheet .tag{flex:0 0 auto;font-size:10.5px;color:#0b7a5e;background:#e8f7f1;border-radius:99px;padding:2px 10px;height:20px}
.sheet .opts{display:grid;grid-template-columns:1fr 1fr;gap:7px 18px;margin:11px 37px 0 0}
.sheet .opt{display:flex;gap:8px;font-size:14px;color:#2b3450;padding:4px 8px;border:1px solid #eef1f8;border-radius:9px;background:#fcfdff}
.sheet .mark{flex:0 0 20px;height:20px;border:1px solid #c3cbe0;border-radius:6px;font-size:11px;display:flex;align-items:center;justify-content:center;color:#5a6480;background:#fff}
.sheet .asset{margin:12px 37px 0 0;padding:12px;border:1px solid #e6eaf4;border-radius:12px;background:#fbfcfe}
.sheet .tbl{border-collapse:collapse;width:100%;font-size:13.5px;background:#fff;overflow:hidden}
.sheet .tbl th,.sheet .tbl td{border:1px solid #ccd4e6;padding:7px 9px;text-align:center}
.sheet .tbl th{background:#eef2fb;font-weight:700;color:#152040}
.sheet .tbl tbody tr:nth-child(even) td{background:#f8fafd}
.sheet .fig{text-align:center;background:#fff;border-radius:8px;padding:6px}
.sheet .fig img{max-width:430px;width:auto;max-height:330px;height:auto;display:block;margin:0 auto;border-radius:6px}
.sheet .fig svg{max-width:430px;width:100%;height:auto;display:block;margin:0 auto}
.sheet .cap{font-size:11.5px;color:#6b7492;text-align:center;margin-top:7px}
.sheet .lines{margin:11px 37px 0 0}
.sheet .lines div{border-bottom:1px dashed #ccd3e5;height:23px}
.sheet .ans{margin:11px 37px 0 0;font-size:14px;color:#0b6b52;background:#eefaf5;border-inline-start:3px solid #0f9b78;border-radius:9px;padding:7px 11px}
.sheet .exp{margin:6px 37px 0 0;font-size:12.5px;color:#5a6480;background:#f8fafc;border-radius:9px;padding:6px 11px}
.sheet .foot{margin-top:28px;border-top:1px solid #edf0f8;padding-top:11px;font-size:10.5px;color:#a2a9be;text-align:center}
`;

/** Renders an elegant RTL sheet and downloads it directly as a real PDF file. */
export async function exportQuizPdf(
  title: string,
  questions: ExportQuestion[],
  withAnswers: boolean,
  branding = true,
) {
  if (!questions.length) throw new Error("لا توجد أسئلة للتصدير");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const { element, cleanup } = await renderInIsolatedFrame(
    buildSheetHtml(title, questions, withAnswers, branding),
  );


  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const sliceHeight = Math.floor((canvas.width * pageH) / pageW);

    // Safe cut points: start offsets of each question block (and the footer),
    // converted to canvas pixels, so a slice never splits a question in half.
    const scale = canvas.height / element.offsetHeight;
    const boundaries = Array.from(
      element.querySelectorAll<HTMLElement>(".q, .foot"),
    )
      .map((el) => Math.round((el.offsetTop + 6) * scale))
      .filter((y) => y > 0 && y < canvas.height)
      .sort((a, b) => a - b);

    const cuts: number[] = [0];
    let offset = 0;
    while (offset + sliceHeight < canvas.height) {
      const limit = offset + sliceHeight;
      const safe = boundaries.filter((y) => y > offset + sliceHeight * 0.35 && y <= limit).pop();
      const next = safe ?? limit;
      cuts.push(next);
      offset = next;
    }
    cuts.push(canvas.height);

    for (let i = 0; i < cuts.length - 1; i++) {
      const height = cuts[i + 1]! - cuts[i]!;
      const page = document.createElement("canvas");
      page.width = canvas.width;
      page.height = height;
      const ctx = page.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, page.width, page.height);
      ctx.drawImage(canvas, 0, -cuts[i]!);
      if (i > 0) pdf.addPage();
      pdf.addImage(
        page.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        pageW,
        (height * pageW) / canvas.width,
      );
    }

    pdf.save(`${title}${withAnswers ? "-الإجابات" : "-الأسئلة"}.pdf`);
  } finally {
    cleanup();
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
