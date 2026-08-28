// Browser-side text extraction from uploaded files.
import mammoth from "mammoth";

export type ExtractResult = { text: string; images: string[] };

const MAX_IMAGES = 8;

export async function extractFromFile(
  file: File,
  onProgress?: (label: string) => void,
): Promise<ExtractResult> {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("image/")) {
    onProgress?.("تحويل الصورة للقراءة البصرية…");
    return { text: "", images: [await fileToDataUrl(file)] };
  }

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    onProgress?.("قراءة النص…");
    return { text: await file.text(), images: [] };
  }

  if (name.endsWith(".docx")) {
    onProgress?.("استخراج نص ملف Word…");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { text: result.value, images: [] };
  }

  if (name.endsWith(".pdf")) {
    onProgress?.("استخراج نص ملف PDF…");
    return await extractFromPdf(file, onProgress);
  }

  throw new Error("نوع الملف غير مدعوم. المدعوم: PDF, DOCX, TXT, صور.");
}

async function extractFromPdf(
  file: File,
  onProgress?: (label: string) => void,
): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`قراءة الصفحة ${i} من ${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")}\n`;
  }

  if (text.replace(/\s/g, "").length > 200) {
    return { text, images: [] };
  }

  // Scanned PDF: render pages as images for AI vision OCR.
  onProgress?.("الملف ممسوح ضوئيًا — تحويل الصفحات لصور…");
  const images: string[] = [];
  const pages = Math.min(pdf.numPages, MAX_IMAGES);
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.8));
  }
  return { text: "", images };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}
