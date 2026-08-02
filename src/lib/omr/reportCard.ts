/**
 * Rank/percentile and subject-wise breakdown math shared by the Results
 * Dashboard, Progress Tracker, and the PDF report card generator — kept
 * here so all three never disagree about where a student placed. Ported
 * verbatim from OMNI OMR Suite's evaluator/reportCard.js.
 *
 * generateReportCardPdf is the one structural change from the original's
 * streamReportCardPdf(res, ...): it collects the pdfkit document into a
 * Buffer and returns it instead of piping straight into an Express
 * response, since a Route Handler builds and returns a Response instead of
 * writing to a live stream.
 */
import PDFDocument from "pdfkit";
import { subjectForQuestion } from "./omrLayout";
import type { OmrResultLike, Subject, MarkingRules, Branding } from "./types";

export const WEAK_ACCURACY_THRESHOLD = 0.4; // below this, a subject is flagged "needs attention"

export type RankInfo = { rank: number; count: number; percentile: number };

/** Rank/percentile for one result within a list of results from the same exam group. */
export function computeRankInfo(
  result: Pick<OmrResultLike, "score">,
  examGroupResults: Pick<OmrResultLike, "score">[]
): RankInfo {
  const count = examGroupResults.length;
  const higherScoreCount = examGroupResults.filter((r) => r.score > result.score).length;
  const rank = higherScoreCount + 1;
  const percentile = count > 1 ? Math.round(((count - rank) / (count - 1)) * 100) : 100;
  return { rank, count, percentile };
}

export type SubjectBreakdownRow = {
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  multiple: number;
  accuracy: number;
  weak: boolean;
};

/** Per-subject correct/wrong/unattempted/multiple counts and accuracy, from a scored result's details[]. */
export function computeSubjectBreakdown(
  result: Pick<OmrResultLike, "details">,
  subjects: Subject[]
): SubjectBreakdownRow[] {
  const bySubject = new Map<
    string,
    { subject: string; total: number; correct: number; wrong: number; unattempted: number; multiple: number }
  >();
  for (const s of subjects.filter((s) => s.count > 0)) {
    bySubject.set(s.name, { subject: s.name, total: s.count, correct: 0, wrong: 0, unattempted: 0, multiple: 0 });
  }
  for (const d of result.details) {
    const subjName = subjectForQuestion(subjects, d.qNum);
    const row = subjName ? bySubject.get(subjName) : undefined;
    if (!row) continue; // shouldn't happen if subjects matches what the sheet was scored against
    if (d.outcome === "correct") row.correct++;
    else if (d.outcome === "wrong") row.wrong++;
    else if (d.outcome === "unattempted") row.unattempted++;
    else if (d.outcome === "multiple") row.multiple++;
  }
  return [...bySubject.values()].map((row) => ({
    ...row,
    accuracy: row.total > 0 ? row.correct / row.total : 0,
    weak: row.total > 0 && row.correct / row.total < WEAK_ACCURACY_THRESHOLD,
  }));
}

const DEFAULT_BRANDING: Branding = {
  instituteName: null, // null -> just show the product name, no institute line
  primaryColor: "#1E3A8A",
  accentColor: "#C0392B",
  logoBuffer: null,
};

function pct(n: number) {
  return Math.round(n * 100) + "%";
}

type Doc = InstanceType<typeof PDFDocument>;

function collectPdfBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/**
 * Builds a one-page report card PDF and returns it as a Buffer.
 * rankInfo: { rank, count, percentile } — see computeRankInfo.
 */
export async function generateReportCardPdf({
  result,
  subjects,
  rules,
  rankInfo,
  branding,
}: {
  result: OmrResultLike;
  subjects: Subject[];
  rules: MarkingRules;
  rankInfo: RankInfo;
  branding?: Branding;
}): Promise<Buffer> {
  const b: Branding = { ...DEFAULT_BRANDING, ...(branding || {}) };
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const bufferPromise = collectPdfBuffer(doc);

  const pageW = doc.page.width - 80;

  // ---- Header ----
  if (b.logoBuffer) {
    try {
      doc.image(b.logoBuffer, 40, 36, { width: 46, height: 46 });
    } catch {
      // Corrupt/unsupported logo image — skip it rather than fail the whole report card.
    }
  }
  const headerX = b.logoBuffer ? 96 : 40;
  doc.fillColor(b.primaryColor).font("Helvetica-Bold").fontSize(18).text(b.instituteName || "OMNI OMR Suite", headerX, 40);
  doc
    .fillColor("#666")
    .font("Helvetica")
    .fontSize(9)
    .text(
      b.instituteName ? "Powered by OMNI OMR Suite" : "Self-practice mock test — not an official score card",
      headerX,
      62
    );
  doc.moveTo(40, 92).lineTo(40 + pageW, 92).strokeColor(b.primaryColor).lineWidth(1.5).stroke();

  doc.fillColor("#111").font("Helvetica-Bold").fontSize(15).text("Report Card", 40, 104);
  doc.fillColor("#444").font("Helvetica").fontSize(10).text(result.examTitle, 40, 124);

  // ---- Student info block ----
  let y = 148;
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(13).text(result.studentName || "Unnamed Student", 40, y);
  y += 20;
  doc.fillColor("#444").font("Helvetica").fontSize(10);
  const rollLine = "Roll No: " + (result.rollNumberEntered || result.rollNumberDetected || "—");
  const setLine = result.detectedSet ? "   ·   Set " + result.detectedSet : "";
  const dateLine = "   ·   " + new Date(result.timestamp).toLocaleDateString();
  doc.text(rollLine + setLine + dateLine, 40, y);
  y += 28;

  // ---- Score hero + rank ----
  const maxMarks = result.totalQuestions * (rules.marksCorrect || 0);
  const heroH = 74;
  doc.roundedRect(40, y, pageW, heroH, 8).fillColor("#F5F7FB").fill();
  doc.fillColor(b.primaryColor).font("Helvetica-Bold").fontSize(30).text(String(result.score), 56, y + 14, { continued: false });
  doc
    .fillColor("#888")
    .font("Helvetica")
    .fontSize(11)
    .text("out of " + maxMarks + (maxMarks > 0 ? "  (" + pct(result.score / maxMarks) + ")" : ""), 56, y + 50);

  const rankX = 40 + pageW - 220;
  doc
    .fillColor("#111")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(rankInfo.count > 1 ? "Rank " + rankInfo.rank + " of " + rankInfo.count : "Only entry so far", rankX, y + 16, {
      width: 200,
      align: "right",
    });
  if (rankInfo.count > 1) {
    doc
      .fillColor("#888")
      .font("Helvetica")
      .fontSize(10)
      .text(rankInfo.percentile + "th percentile in this exam", rankX, y + 40, { width: 200, align: "right" });
  }
  y += heroH + 20;

  // ---- Subject-wise breakdown ----
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(12).text("Subject-wise Performance", 40, y);
  y += 20;

  const subjectRows = computeSubjectBreakdown(result, subjects);
  const colX = { subject: 40, total: 220, correct: 270, wrong: 330, unattempted: 400, accuracy: 480 };
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#666");
  doc.text("Subject", colX.subject, y);
  doc.text("Qs", colX.total, y);
  doc.text("Correct", colX.correct, y);
  doc.text("Wrong", colX.wrong, y);
  doc.text("Skipped", colX.unattempted, y);
  doc.text("Accuracy", colX.accuracy, y);
  y += 14;
  doc.moveTo(40, y).lineTo(40 + pageW, y).strokeColor("#ddd").lineWidth(0.75).stroke();
  y += 8;

  for (const row of subjectRows) {
    if (row.weak) {
      doc.rect(38, y - 3, pageW + 4, 18).fillColor("#FFF3DC").fill();
    }
    doc.font("Helvetica").fontSize(9.5).fillColor("#222");
    doc.text(row.subject, colX.subject, y);
    doc.text(String(row.total), colX.total, y);
    doc.fillColor("#1f8b4c").text(String(row.correct), colX.correct, y);
    doc.fillColor("#c0392b").text(String(row.wrong), colX.wrong, y);
    doc.fillColor("#888").text(String(row.unattempted), colX.unattempted, y);
    doc
      .fillColor(row.weak ? "#a0670c" : "#222")
      .font(row.weak ? "Helvetica-Bold" : "Helvetica")
      .text(pct(row.accuracy) + (row.weak ? "  (!) needs attention" : ""), colX.accuracy, y);
    y += 18;
  }
  y += 10;

  // ---- Overall stats strip ----
  doc.moveTo(40, y).lineTo(40 + pageW, y).strokeColor("#ddd").lineWidth(0.75).stroke();
  y += 12;
  const stats: [string, number, string][] = [
    ["Correct", result.correctCount, "#1f8b4c"],
    ["Wrong", result.wrongCount, "#c0392b"],
    ["Unattempted", result.unattemptedCount, "#888"],
    ["Multiple marks", result.multipleCount, "#a0670c"],
  ];
  const stripColW = pageW / stats.length;
  stats.forEach(([label, value, color], i) => {
    const x = 40 + i * stripColW;
    doc.fillColor(color).font("Helvetica-Bold").fontSize(16).text(String(value), x, y, { width: stripColW, align: "center" });
    doc.fillColor("#888").font("Helvetica").fontSize(8.5).text(label, x, y + 22, { width: stripColW, align: "center" });
  });
  y += 50;

  // ---- Footer ----
  doc
    .fillColor("#aaa")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Generated by OMNI OMR Suite on " + new Date().toLocaleString() + ". This is a self-practice report, not an official score card.",
      40,
      doc.page.height - 60,
      { width: pageW, align: "center" }
    );

  doc.end();
  return bufferPromise;
}
