/**
 * Core OMR PDF generation logic — ported verbatim (visual design/layout
 * unchanged) from OMNI OMR Suite's generateOmr.js. The only real change is
 * the I/O boundary: the original wrote straight to a local outPath via
 * fs.createWriteStream; there's no persistent filesystem in a serverless
 * function, so both functions here collect the PDF into a Buffer instead
 * and the caller uploads/returns it (see storage.ts's uploadOmrSheetPdf).
 *
 * Visual design modelled on a commercial OMR-sheet template the user
 * supplied as a reference (magenta/pink color scheme, instructions +
 * correct/wrong-method legend, digit-in-bubble roll-number grid, booklet
 * code grid, side timing marks, letter-in-bubble response grid, single-page
 * multi-column layout). The reference sheet's own branding/logo/contact
 * details (a specific printing company's) are NOT reproduced — only the
 * generic structural/style pattern, which is common across OMR vendors.
 * No functional barcode is drawn (it's a decorative placeholder only) since
 * nothing here is meant to be scanned by a real OMR machine.
 */
import PDFDocument from "pdfkit";
import type { Subject } from "./omrLayout";
import type { Branding } from "./types";

type Doc = InstanceType<typeof PDFDocument>;

const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

const PINK = "#E6007E";
const PINK_LIGHT = "#FBE4F1";
const BLACK = "#000000";
const GRAY = "#666666";

function centerText(doc: Doc, text: string, x: number, y: number, w: number, opts: PDFKit.Mixins.TextOptions = {}) {
  doc.text(text, x, y, Object.assign({ width: w, align: "center" }, opts));
}

// A bubble (circle) with a label drawn centred inside it.
function labelledBubble(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  label: string | number | null | undefined,
  opts: { color?: string; lineWidth?: number; textColor?: string; fontSize?: number; font?: string } = {}
) {
  const color = opts.color || PINK;
  doc.save();
  doc.lineWidth(opts.lineWidth || 0.9);
  doc.circle(cx, cy, r).strokeColor(color).stroke();
  if (label !== undefined && label !== null) {
    const fontSize = opts.fontSize || r * 1.15;
    doc.fillColor(opts.textColor || color).fontSize(fontSize).font(opts.font || "Helvetica-Bold");
    doc.text(String(label), cx - r, cy - fontSize / 2 + 0.5, { width: r * 2, align: "center", lineBreak: false });
  }
  doc.restore();
  doc.fillColor(BLACK).strokeColor(BLACK);
}

function timingMarks(doc: Doc, topY: number, bottomY: number) {
  doc.save();
  doc.fillColor(BLACK);
  const markH = 6,
    gap = 4.2,
    w = 12;
  let y = topY;
  while (y < bottomY) {
    doc.rect(6, y, w, markH).fill();
    doc.rect(PAGE_WIDTH - 6 - w, y, w, markH).fill();
    y += markH + gap;
  }
  doc.restore();
}

function box(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { lineWidth?: number; stroke?: string; fill?: string } = {}
) {
  doc.save();
  doc.lineWidth(opts.lineWidth || 1).strokeColor(opts.stroke || PINK);
  if (opts.fill) doc.rect(x, y, w, h).fillAndStroke(opts.fill, opts.stroke || PINK);
  else doc.rect(x, y, w, h).stroke();
  doc.restore();
  doc.fillColor(BLACK).strokeColor(BLACK);
}

type PresetCandidate = { name?: string; rollNumber?: string; bookletSeries?: string };

type SheetMeta = {
  sections: Subject[]; // 1-5 entries, resolved names/counts — see MAX_SECTIONS
  total: number;
  examTitle: string;
  instructionLines: string[];
  presetCandidate?: PresetCandidate;
  branding?: Branding;
};

// ---------------- Masthead + Instructions + Legend ----------------
// branding (white-label) is deliberately fit into this SAME 62pt-tall
// masthead budget rather than growing it: omrLayout.ts hardcodes every
// bubble coordinate below this point assuming the masthead is exactly 62pt
// tall, so changing that height would misalign the scanner against the
// printed sheet. A small corner logo + swapping the top line to the
// institute's name is the only branding surface available here.
function drawMasthead(doc: Doc, examTitle: string, branding?: Branding) {
  const hasBranding = Boolean(branding && (branding.instituteName || branding.logoBuffer));
  if (branding && branding.logoBuffer) {
    try {
      doc.image(branding.logoBuffer, PAGE_WIDTH - MARGIN - 34, 3, { width: 30, height: 30 });
    } catch {
      // Corrupt/unsupported logo — skip it rather than fail sheet generation.
    }
  }
  const titleColor = hasBranding && branding?.primaryColor ? branding.primaryColor : PINK;
  doc.fillColor(titleColor).font("Helvetica-Bold").fontSize(15);
  centerText(doc, hasBranding && branding?.instituteName ? branding.instituteName : "OMNI OMR CREATOR", MARGIN, 6, CONTENT_WIDTH);
  doc.fillColor(GRAY).font("Helvetica-Oblique").fontSize(7.5);
  centerText(doc, "Self-practice mock test — not an official exam document", MARGIN, 24, CONTENT_WIDTH);
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(11.5);
  centerText(doc, examTitle, MARGIN, 40, CONTENT_WIDTH);
  doc.fillColor(BLACK);
}

function drawInstructionsAndLegend(doc: Doc, y: number, meta: SheetMeta): number {
  const h = 92;
  box(doc, MARGIN, y, CONTENT_WIDTH, h);
  doc.moveTo(MARGIN + 330, y).lineTo(MARGIN + 330, y + h).strokeColor(PINK).lineWidth(1).stroke();

  // Left: instructions (all 5 lines come pre-resolved from buildSheetMeta,
  // defaults substituted for any blank/omitted line — see resolveInstructionLines)
  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(9.5);
  doc.text("Instructions", MARGIN + 8, y + 6, { underline: true });
  doc.fillColor(BLACK).font("Helvetica").fontSize(7.6);
  let iy = y + 20;
  meta.instructionLines.forEach((line, idx) => {
    doc.text(`${idx + 1}. ${line}`, MARGIN + 8, iy, { width: 314, lineGap: 0.5 });
    iy = doc.y + 2.5;
  });

  // Right: correct/wrong method legend
  const lx = MARGIN + 340;
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(7.6);
  doc.text("Correct Method", lx + 60, y + 6, { lineBreak: false });
  doc.text("Wrong Method", lx + 60, y + 24, { lineBreak: false });
  doc.text("Wrong Method", lx + 60, y + 42, { lineBreak: false });
  doc.text("Wrong Method", lx + 60, y + 60, { lineBreak: false });

  const r = 6;
  const rowYs = [y + 12, y + 30, y + 48, y + 66];
  // row 1: correct -> one bubble fully filled
  ["A", "B", "C", "D"].forEach((L, i) => {
    const cx = lx + i * 15;
    if (i === 1) {
      doc.circle(cx, rowYs[0], r).fillColor(PINK).fill();
    } else {
      labelledBubble(doc, cx, rowYs[0], r, L, { fontSize: 6.5 });
    }
  });
  // row 2: wrong -> checkmark instead of fill
  ["A", "B", "C", "D"].forEach((L, i) => {
    const cx = lx + i * 15;
    labelledBubble(doc, cx, rowYs[1], r, i === 1 ? "" : L, { fontSize: 6.5 });
    if (i === 1) {
      doc
        .save()
        .strokeColor(PINK)
        .lineWidth(1.2)
        .moveTo(cx - 3, rowYs[1])
        .lineTo(cx - 0.5, rowYs[1] + 2.5)
        .lineTo(cx + 3.5, rowYs[1] - 3)
        .stroke()
        .restore();
    }
  });
  // row 3: wrong -> partial/light fill (small dot)
  ["A", "B", "C", "D"].forEach((L, i) => {
    const cx = lx + i * 15;
    labelledBubble(doc, cx, rowYs[2], r, i === 1 ? "" : L, { fontSize: 6.5 });
    if (i === 1) doc.circle(cx, rowYs[2], 2).fillColor(PINK).fill();
  });
  // row 4: wrong -> cross mark
  ["A", "B", "C", "D"].forEach((L, i) => {
    const cx = lx + i * 15;
    labelledBubble(doc, cx, rowYs[3], r, i === 1 ? "" : L, { fontSize: 6.5 });
    if (i === 1) {
      doc.save().strokeColor(PINK).lineWidth(1.1);
      doc.moveTo(cx - 3, rowYs[3] - 3).lineTo(cx + 3, rowYs[3] + 3).stroke();
      doc.moveTo(cx + 3, rowYs[3] - 3).lineTo(cx - 3, rowYs[3] + 3).stroke();
      doc.restore();
    }
  });
  doc.fillColor(BLACK).strokeColor(BLACK);
  return y + h;
}

// ---------------- Candidate details ----------------
function drawCandidateDetails(doc: Doc, y: number, meta: SheetMeta): number {
  const h = 172; // must comfortably contain the 10-row roll-number bubble grid below
  box(doc, MARGIN, y, CONTENT_WIDTH, h);

  // --- Roll Number (digit-in-bubble grid) ---
  // presetCandidate (batch roster import) pre-fills both the handwrite boxes
  // (as printed digits) and the matching bubble per column, so the student
  // doesn't have to bubble their own roll number and the Evaluate tab's
  // auto-roll-read has nothing to misread.
  const presetRoll = meta.presetCandidate?.rollNumber;
  const rnX = MARGIN + 8,
    rnY = y + 8;
  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(9).text("Roll Number", rnX, rnY);
  const numDigits = 8;
  const colW = 20.5;
  const boxRowH = 15;
  for (let d = 0; d < numDigits; d++) {
    box(doc, rnX + d * colW, rnY + 13, colW - 2.5, boxRowH);
    if (presetRoll) {
      doc
        .fillColor(BLACK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(presetRoll[d], rnX + d * colW, rnY + 13 + 2, { width: colW - 2.5, align: "center", lineBreak: false });
    }
  }
  const bubbleTop = rnY + 13 + boxRowH + 4;
  const bR = 5.6,
    pitch = 12.4;
  for (let digit = 0; digit <= 9; digit++) {
    for (let d = 0; d < numDigits; d++) {
      const cx = rnX + d * colW + (colW - 2.5) / 2;
      const cy = bubbleTop + digit * pitch + bR;
      const isPreset = presetRoll && Number(presetRoll[d]) === digit;
      if (isPreset) {
        doc.circle(cx, cy, bR).fillColor(PINK).fill();
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(6.2)
          .text(String(digit), cx - bR, cy - 3.1, { width: bR * 2, align: "center", lineBreak: false });
        doc.fillColor(BLACK).strokeColor(BLACK);
      } else {
        labelledBubble(doc, cx, cy, bR, digit, { fontSize: 6.2 });
      }
    }
  }
  // --- Test Booklet Code (2-D grid: series letter x code number) ---
  // presetCandidate.bookletSeries (batch roster import, round-robin across
  // this exam's active sets) pre-marks one cell the same way, so a shuffled
  // multi-set batch needs zero manual bubbling for set assignment either.
  const presetSeries = meta.presetCandidate?.bookletSeries;
  const bcX = rnX + numDigits * colW + 16;
  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(9).text("Test Booklet Code", bcX, rnY);
  const codeNums = ["1", "2", "3", "4"];
  const seriesLetters = ["P", "Q", "R", "S"];
  const bcColW = 16.5;
  const bcLabelW = 13;
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(7);
  codeNums.forEach((n, i) => {
    labelledBubble(doc, bcX + bcLabelW + i * bcColW + bcColW / 2, rnY + 18, 7, n, { fontSize: 7 });
  });
  seriesLetters.forEach((letter, r) => {
    const ry = rnY + 32 + r * 13.5;
    doc.fillColor(PINK).font("Helvetica-Bold").fontSize(7.5).text(letter, bcX, ry - 4);
    codeNums.forEach((n, c) => {
      const cx = bcX + bcLabelW + c * bcColW + bcColW / 2;
      if (presetSeries === letter && n === "1") {
        doc.circle(cx, ry, 5.6).fillColor(PINK).fill();
        doc.fillColor(BLACK).strokeColor(BLACK);
      } else {
        labelledBubble(doc, cx, ry, 5.6, null, { fontSize: 6 });
      }
    });
  });
  doc
    .fillColor(GRAY)
    .font("Helvetica")
    .fontSize(6)
    .text("Check your booklet code & roll no. bubbles carefully before starting.", bcX, rnY + 32 + 4 * 13.5 + 4, { width: 100 });

  // --- Student's Name / Name of Exam / Date / Category ---
  const infoX = bcX + bcLabelW + 4 * bcColW + 18;
  const infoW = MARGIN + CONTENT_WIDTH - infoX - 108;
  let iy = rnY;
  doc.fillColor(BLACK).font("Helvetica").fontSize(8);
  doc.text("Student's Name:", infoX, iy);
  if (meta.presetCandidate?.name) {
    doc.font("Helvetica-Bold").text(meta.presetCandidate.name, infoX + 92, iy, { width: infoW - 92, lineBreak: false });
    doc.font("Helvetica");
  }
  doc.moveTo(infoX, iy + 13).lineTo(infoX + infoW, iy + 13).strokeColor(PINK).stroke();
  iy += 22;
  doc.text("Name of Exam / Topic:", infoX, iy);
  doc.moveTo(infoX, iy + 13).lineTo(infoX + infoW, iy + 13).strokeColor(PINK).stroke();
  iy += 22;

  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(8).text("Date of Exam", infoX, iy);
  const dW = 16;
  ["D", "D", "M", "M", "Y", "Y"].forEach((_l, i) => {
    box(doc, infoX + i * (dW + 2), iy + 12, dW, 15);
  });
  iy += 34;

  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(8).text("Category", infoX, iy);
  const categories = ["Class XI", "Class XII", "Repeater", "Full Test"];
  doc.fillColor(BLACK).font("Helvetica").fontSize(7.3);
  categories.forEach((c, i) => {
    const cy = iy + 13 + i * 11.5;
    labelledBubble(doc, infoX + 5, cy, 4.2, null, { fontSize: 5 });
    doc.text(c, infoX + 13, cy - 4.5);
  });

  // --- Answer Sheet Code (decorative placeholder, not a functional barcode) ---
  const codeX = MARGIN + CONTENT_WIDTH - 98;
  box(doc, codeX, rnY, 98, 34);
  doc.fillColor(GRAY).font("Helvetica").fontSize(6.3).text("Answer Sheet Code", codeX, rnY - 8, { width: 98, align: "left" });
  doc.save();
  let bx = codeX + 6;
  const barTop = rnY + 5,
    barH = 20;
  // Primes just need to vary the seed per-section, not carry any meaning —
  // 5 is enough since MAX_SECTIONS caps sections.length there.
  const SEED_PRIMES = [31, 17, 7, 23, 13];
  const seed = meta.sections.reduce((acc, s, i) => acc + s.count * SEED_PRIMES[i], 0) % 97;
  for (let i = 0; i < 34 && bx < codeX + 92; i++) {
    const wBar = ((seed + i * 13) % 3) + 1;
    if ((seed + i) % 5 !== 0) doc.rect(bx, barTop, wBar, barH).fillColor(BLACK).fill();
    bx += wBar + 1.6;
  }
  doc.restore();
  doc
    .fillColor(GRAY)
    .font("Helvetica")
    .fontSize(6.5)
    .text(`SAMPLE-${String(meta.total).padStart(3, "0")}-${seed}`, codeX, rnY + 34 + 2, { width: 98, align: "center" });

  doc.fillColor(BLACK).strokeColor(BLACK);
  return y + h;
}

// ---------------- Responses grid (single continuous sheet, multi-column) ----------------
function drawResponsesGrid(doc: Doc, gridTop: number, gridBottom: number, subjects: Subject[]) {
  const availableHeight = gridBottom - gridTop;
  const headerH = 16;
  const minPitch = 11.2;
  const maxPitch = 24;
  const total = subjects.reduce((s, sub) => s + sub.count, 0);

  const maxRowsPerColAtMin = Math.max(1, Math.floor((availableHeight - headerH) / minPitch));
  let numColumns = Math.max(1, Math.ceil(total / maxRowsPerColAtMin));
  const colGap = 8;
  let colWidth = (CONTENT_WIDTH - colGap * (numColumns - 1)) / numColumns;
  const minColWidth = 78;
  if (colWidth < minColWidth) {
    numColumns = Math.max(1, Math.floor((CONTENT_WIDTH + colGap) / (minColWidth + colGap)));
    colWidth = (CONTENT_WIDTH - colGap * (numColumns - 1)) / numColumns;
  }
  const rowsPerColumn = Math.ceil(total / numColumns);
  const rowPitch = Math.min(maxPitch, Math.max(minPitch, (availableHeight - headerH) / rowsPerColumn));

  const qLabelWidth = Math.min(28, colWidth * 0.26);
  const bubbleAreaWidth = colWidth - qLabelWidth;
  const bubblePitch = bubbleAreaWidth / 4;
  const bubbleR = Math.min(6.5, bubblePitch * 0.34, rowPitch * 0.34);

  // figure out which subject each absolute question number belongs to
  function subjectAt(qAbs: number): string {
    let cursor = 1;
    for (const s of subjects) {
      if (qAbs >= cursor && qAbs < cursor + s.count) return s.name;
      cursor += s.count;
    }
    return subjects[subjects.length - 1].name;
  }

  for (let c = 0; c < numColumns; c++) {
    const colX = MARGIN + c * (colWidth + colGap);
    const colStartQ = 1 + c * rowsPerColumn;
    const colCount = Math.min(rowsPerColumn, total - c * rowsPerColumn);
    const bodyH = colCount * rowPitch;

    // outer table-style border around this column block (header + body)
    doc.save().lineWidth(1).strokeColor(PINK).rect(colX, gridTop, colWidth, headerH + bodyH).stroke().restore();

    // pink header bar
    doc.rect(colX, gridTop, colWidth, headerH).fillColor(PINK).fill();
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text("Responses", colX, gridTop + 4, { width: colWidth, align: "center" });
    doc.fillColor(BLACK);

    // vertical divider: question number column vs. bubble area
    const dividerX = colX + qLabelWidth;
    doc
      .save()
      .lineWidth(0.75)
      .strokeColor(PINK)
      .moveTo(dividerX, gridTop + headerH)
      .lineTo(dividerX, gridTop + headerH + bodyH)
      .stroke()
      .restore();

    // faint vertical dividers between each option bubble (A|B|C|D)
    doc.save().lineWidth(0.4).strokeColor(PINK_LIGHT);
    for (let i = 1; i < 4; i++) {
      const dx = colX + qLabelWidth + bubblePitch * i;
      doc.moveTo(dx, gridTop + headerH).lineTo(dx, gridTop + headerH + bodyH).stroke();
    }
    doc.restore();

    for (let r = 0; r < colCount; r++) {
      const qNum = colStartQ + r;
      const rowY = gridTop + headerH + r * rowPitch;
      subjectAt(qNum); // computed for parity with the original; grid itself doesn't render the subject label per-row

      // faint horizontal row divider (skip the very first row's top edge, already bordered)
      if (r > 0) {
        doc.save().lineWidth(0.4).strokeColor(PINK_LIGHT).moveTo(colX, rowY).lineTo(colX + colWidth, rowY).stroke().restore();
      }

      doc
        .fillColor(PINK)
        .font("Helvetica-Bold")
        .fontSize(7.2)
        .text(String(qNum), colX + 1, rowY + rowPitch / 2 - 4, { width: qLabelWidth - 3, align: "right" });
      ["A", "B", "C", "D"].forEach((letter, i) => {
        const bx = colX + qLabelWidth + bubblePitch * i + bubblePitch / 2;
        const by = rowY + rowPitch / 2;
        labelledBubble(doc, bx, by, bubbleR, letter, { fontSize: Math.max(5, bubbleR * 1.05) });
      });
    }
  }
  doc.fillColor(BLACK).strokeColor(BLACK);
  return { numColumns, rowsPerColumn, bottom: gridTop + headerH + rowsPerColumn * rowPitch };
}

function drawFooter(doc: Doc, y: number) {
  const h = 34;
  const halfW = (CONTENT_WIDTH - 12) / 2;
  box(doc, MARGIN, y, halfW, h);
  box(doc, MARGIN + halfW + 12, y, halfW, h);
  doc.fillColor(PINK).font("Helvetica-Bold").fontSize(8);
  doc.text("Student's Sign", MARGIN + 8, y + h / 2 - 5);
  doc.text("Invigilator's Name & Sign", MARGIN + halfW + 12 + 8, y + h / 2 - 5);
  doc.fillColor(BLACK);
}

function drawOmrSheet(doc: Doc, meta: SheetMeta) {
  drawMasthead(doc, meta.examTitle, meta.branding);
  let y = 62;
  y = drawInstructionsAndLegend(doc, y, meta);
  y += 6;
  y = drawCandidateDetails(doc, y, meta);
  y += 8;

  const footerH = 34;
  const gridBottom = PAGE_HEIGHT - MARGIN - footerH - 8;
  const subjects: Subject[] = meta.sections.filter((s) => s.count > 0);

  const result = drawResponsesGrid(doc, y, gridBottom, subjects);
  timingMarks(doc, 60, gridBottom + 10);
  drawFooter(doc, PAGE_HEIGHT - MARGIN - footerH);
  return result;
}

const DEFAULT_EXAM_TITLE = "NEET (UG) 2027  —  Practice OMR Answer Sheet";
const DEFAULT_SECTIONS: Subject[] = [
  { name: "Physics", count: 45 },
  { name: "Chemistry", count: 45 },
  { name: "Biology", count: 90 },
];
// Wide exams like CUET/CLAT run 4-5 sections (languages, domain subjects,
// general test, legal/logical reasoning, ...) — 5 is comfortably above what
// any real exam needs while still fitting legibly in the fixed masthead/grid
// budget below.
const MAX_SECTIONS = 5;
const DEFAULT_INSTRUCTIONS = [
  "Use Blue/Black Ball point pen (fine tip) only.",
  "Do not make any stray marks on this sheet.",
  "Do not fold, tear, or wrinkle the response sheet.",
  "Darken the bubble completely — see correct/wrong examples on the right.",
  // line 5 is the question-distribution summary, auto-generated below unless overridden
];

// Resolves the 5 instruction lines: any blank/omitted line falls back to its
// default, and line 5 falls back to an auto-generated question-distribution
// summary built from the actual (already-resolved) sections.
function resolveInstructionLines(instructions: string[] | undefined, sections: Subject[], total: number): string[] {
  const distParts: string[] = [];
  let cursor = 1;
  for (const s of sections) {
    if (s.count > 0) distParts.push(`${s.name} Q.${cursor}-${cursor + s.count - 1}`);
    cursor += s.count;
  }
  const autoDistribution = `Total ${total} questions: ${distParts.join(", ")}.`;
  const defaults = [...DEFAULT_INSTRUCTIONS, autoDistribution];

  const lines: string[] = [];
  for (let i = 0; i < 5; i++) {
    const custom = instructions && instructions[i] && String(instructions[i]).trim();
    lines.push(custom || defaults[i]);
  }
  return lines;
}

export type GenerateSheetInput = {
  sections: Subject[]; // 1-5 entries; extras beyond MAX_SECTIONS are dropped, not an error
  examTitle?: string;
  instructions?: string[];
  branding?: Branding;
};

function buildSheetMeta(input: GenerateSheetInput & { presetCandidate?: PresetCandidate }): SheetMeta {
  const { examTitle, instructions, presetCandidate, branding } = input;
  const rawSections = input.sections && input.sections.length > 0 ? input.sections.slice(0, MAX_SECTIONS) : DEFAULT_SECTIONS;
  const resolvedSections: Subject[] = rawSections.map((s, i) => ({
    name: (s.name && s.name.trim()) || `Section ${i + 1}`,
    count: Math.max(0, s.count || 0),
  }));
  const total = resolvedSections.reduce((sum, s) => sum + s.count, 0);
  return {
    sections: resolvedSections,
    total,
    examTitle: (examTitle && examTitle.trim()) || DEFAULT_EXAM_TITLE,
    instructionLines: resolveInstructionLines(instructions, resolvedSections, total),
    presetCandidate,
    branding,
  };
}

function collectPdfBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/**
 * Builds a single-sheet OMR PDF and returns it as a Buffer (caller uploads
 * it via storage.ts's uploadOmrSheetPdf and/or streams it straight back as
 * the download response).
 */
export async function generateOmrPdf(
  input: GenerateSheetInput
): Promise<{ buffer: Buffer; total: number; pages: number }> {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
  const bufferPromise = collectPdfBuffer(doc);

  const meta = buildSheetMeta(input);
  doc.addPage({ size: "A4", margin: 0 });
  drawOmrSheet(doc, meta);
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, total: meta.total, pages: 1 };
}

/**
 * Batch roster import: one PDF, one page per roster entry, each pre-filled
 * with that student's name (printed) and roll number (printed + bubbled) so
 * neither has to be handwritten/bubbled by the student, and the Evaluate
 * tab's auto-roll-read has nothing to misread. If activeSets has more than
 * one entry, each page's Test Booklet Code is also pre-bubbled, round-robin
 * across those sets, so a shuffled multi-set batch needs zero manual
 * bubbling for set assignment either.
 *
 * roster: [{ name, rollNumber }] — rollNumber must be a numeric string of up
 * to 8 digits (left-padded with zeros); validated by the caller (see
 * roster.ts) before this is called, so this function assumes clean input.
 */
export async function generateBatchOmrPdf(
  input: GenerateSheetInput & { roster: { name: string; rollNumber: string }[]; activeSets?: string[] }
): Promise<{ buffer: Buffer; total: number; pages: number }> {
  const { roster, activeSets, ...rest } = input;
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
  const bufferPromise = collectPdfBuffer(doc);

  const sets = activeSets && activeSets.length > 0 ? activeSets : ["P"];
  let total = 0;
  roster.forEach((student, i) => {
    const meta = buildSheetMeta({
      ...rest,
      presetCandidate: {
        name: student.name,
        rollNumber: student.rollNumber,
        bookletSeries: sets.length > 1 ? sets[i % sets.length] : undefined,
      },
    });
    total = meta.total;
    doc.addPage({ size: "A4", margin: 0 });
    drawOmrSheet(doc, meta);
  });
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, total, pages: roster.length };
}
