import jsPDF from "jspdf";
import regularFontUrl from "../assets/fonts/pdf/Amiri-Regular.ttf?url";
import boldFontUrl from "../assets/fonts/pdf/Amiri-Bold.ttf?url";

const arabicText = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
let fontData;

async function loadFont(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the PDF Arabic font.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export async function createReportPDF(options) {
  if (!fontData) {
    fontData = Promise.all([loadFont(regularFontUrl), loadFont(boldFontUrl)])
      .catch((error) => { fontData = undefined; throw error; });
  }
  const [regular, bold] = await fontData;
  const document = new jsPDF(options);
  document.addFileToVFS("Amiri-Regular.ttf", regular);
  document.addFileToVFS("Amiri-Bold.ttf", bold);
  document.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  document.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  // Reorder logical Unicode before jsPDF encodes the custom font's glyph IDs.
  // Keep Latin/numeric runs LTR, including inside mixed Arabic/English lines.
  const bidi = new jsPDF.__bidiEngine__({
    isInputVisual: false, isOutputVisual: true,
    isInputRtl: false, isOutputRtl: false,
  });
  const originalText = document.text.bind(document);
  document.text = (text, x, y, textOptions = {}) => {
    const lines = Array.isArray(text) ? text : [text];
    if (!lines.some((line) => arabicText.test(line))) {
      return originalText(text, x, y, textOptions);
    }
    const font = document.getFont();
    document.setFont("Amiri", font.fontStyle === "bold" ? "bold" : "normal");
    const visualLines = lines.map((line) => bidi.doBidiReorder(document.processArabic(line)));
    try {
      return originalText(Array.isArray(text) ? visualLines : visualLines[0], x, y, {
        ...textOptions,
        isInputVisual: true, isOutputVisual: true,
        isInputRtl: false, isOutputRtl: false,
      });
    } finally {
      document.setFont(font.fontName, font.fontStyle);
    }
  };
  return document;
}

export function prepareReportPDFCell({ cell }) {
  if (cell.text.some((line) => arabicText.test(line))) {
    // Set the font before AutoTable measures and wraps the cell.
    cell.styles.font = "Amiri";
    if (/^[\s\u0600-\u06ff]*[\u0600-\u06ff]/.test(cell.text.join(" "))) {
      cell.styles.halign = "right";
    }
  }
}
