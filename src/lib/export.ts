// Export a quiz to .docx (questions sheet + answer key) and to PDF via print.
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

export function exportQuizPdf(title: string, questions: ExportQuestion[], withAnswers: boolean) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>
  body{font-family:"IBM Plex Sans Arabic",sans-serif;margin:40px;color:#1c2540;line-height:1.9}
  h1{font-size:22px;margin-bottom:24px}
  .q{margin-bottom:18px}
  .p{font-weight:600}
  .o{margin-inline-start:20px}
  .a{color:#0f7a5a}
  .e{color:#5a6480;font-size:13px}
</style></head><body>
<h1>${escapeHtml(title)}${withAnswers ? " — ورقة الإجابات" : ""}</h1>
${questions
  .map(
    (q, i) => `<div class="q"><div class="p">${i + 1}. ${escapeHtml(q.prompt)} <small>(${
      TYPE_LABELS[q.type] ?? q.type
    })</small></div>
${(q.options ?? []).map((o) => `<div class="o">- ${escapeHtml(o)}</div>`).join("")}
${withAnswers ? `<div class="o a">الإجابة: ${escapeHtml(q.correct_answer ?? "—")}</div>` : ""}
${withAnswers && q.explanation ? `<div class="o e">الشرح: ${escapeHtml(q.explanation)}</div>` : ""}
</div>`,
  )
  .join("")}
<script>window.onload=()=>{setTimeout(()=>window.print(),400)}</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) throw new Error("الرجاء السماح بالنوافذ المنبثقة لتصدير PDF");
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
