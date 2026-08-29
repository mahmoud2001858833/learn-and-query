// Export a quiz to .docx (questions sheet + answer key) and to a downloadable PDF.
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export type ExportQuestion = {
  position: number;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
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

export async function exportQuizDocx(
  title: string,
  questions: ExportQuestion[],
  withAnswers: boolean,
) {
  const body: Paragraph[] = [heading(withAnswers ? `${title} — ورقة الإجابات` : title)];

  questions.forEach((q, i) => {
    body.push(line(`${i + 1}. ${q.prompt}  (${TYPE_LABELS[q.type] ?? q.type})`, true));
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
  });

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

function buildSheetHtml(title: string, questions: ExportQuestion[], withAnswers: boolean) {
  const today = new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(new Date());
  const counts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([t, n]) => `${TYPE_LABELS[t] ?? t}: ${n}`)
    .join("  ·  ");

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
  ${options ? `<div class="opts">${options}</div>` : ""}
  ${blank}${answer}${why}
</section>`;
    })
    .join("");

  return `<div class="sheet">
  <header class="hero">
    <div class="bar"></div>
    <h1>${escapeHtml(title)}${withAnswers ? " — نموذج الإجابات" : ""}</h1>
    <div class="meta"><span>${questions.length} سؤالًا</span><span>${today}</span></div>
    <div class="sub">${summary}</div>
    ${
      withAnswers
        ? ""
        : `<div class="fields"><span>الاسم: ..............................</span><span>الصف: ................</span><span>الدرجة: ......../${questions.length}</span></div>`
    }
  </header>
  ${blocks}
  <footer class="foot">أُنشئت بواسطة منصة اسأل كتابك</footer>
</div>`;
}

const SHEET_CSS = `
.sheet{font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;direction:rtl;background:#fff;color:#1a2340;width:794px;box-sizing:border-box;padding:46px 52px;line-height:1.9}
.sheet .hero{margin-bottom:30px}
.sheet .bar{height:6px;border-radius:99px;background:linear-gradient(90deg,#1e3a8a,#0f9b78);margin-bottom:18px}
.sheet h1{font-size:26px;font-weight:700;margin:0 0 10px;color:#152040}
.sheet .meta{display:flex;gap:16px;font-size:13px;color:#0f9b78;font-weight:600}
.sheet .sub{font-size:12px;color:#6b7492;margin-top:6px}
.sheet .fields{display:flex;gap:20px;font-size:13px;color:#39415e;margin-top:16px;padding:12px 14px;border:1px solid #e3e7f2;border-radius:10px;background:#f8fafc}
.sheet .q{padding:16px 0;border-top:1px solid #e6eaf4;break-inside:avoid}
.sheet .qhead{display:flex;align-items:flex-start;gap:10px}
.sheet .num{flex:0 0 26px;height:26px;border-radius:8px;background:#1e3a8a;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}
.sheet .prompt{flex:1;font-size:16px;font-weight:600}
.sheet .tag{flex:0 0 auto;font-size:11px;color:#0f9b78;background:#e8f7f1;border-radius:99px;padding:2px 10px;height:20px}
.sheet .opts{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin:10px 36px 0 0}
.sheet .opt{display:flex;gap:8px;font-size:14px;color:#2b3450}
.sheet .mark{flex:0 0 20px;height:20px;border:1px solid #c3cbe0;border-radius:6px;font-size:11px;display:flex;align-items:center;justify-content:center;color:#5a6480}
.sheet .lines{margin:10px 36px 0 0}
.sheet .lines div{border-bottom:1px dashed #ccd3e5;height:22px}
.sheet .ans{margin:10px 36px 0 0;font-size:14px;color:#0b6b52;background:#eefaf5;border-inline-start:3px solid #0f9b78;border-radius:8px;padding:6px 10px}
.sheet .exp{margin:6px 36px 0 0;font-size:12.5px;color:#5a6480}
.sheet .foot{margin-top:26px;border-top:1px solid #e6eaf4;padding-top:10px;font-size:11px;color:#959cb4;text-align:center}
`;

/** Renders an elegant RTL sheet and downloads it directly as a real PDF file. */
export async function exportQuizPdf(
  title: string,
  questions: ExportQuestion[],
  withAnswers: boolean,
) {
  if (!questions.length) throw new Error("لا توجد أسئلة للتصدير");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const { element, cleanup } = await renderInIsolatedFrame(
    buildSheetHtml(title, questions, withAnswers),
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

    let offset = 0;
    let firstPage = true;
    while (offset < canvas.height) {
      const height = Math.min(sliceHeight, canvas.height - offset);
      const page = document.createElement("canvas");
      page.width = canvas.width;
      page.height = height;
      const ctx = page.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, page.width, page.height);
      ctx.drawImage(canvas, 0, -offset);
      if (!firstPage) pdf.addPage();
      pdf.addImage(
        page.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        pageW,
        (height * pageW) / canvas.width,
      );
      firstPage = false;
      offset += sliceHeight;
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
