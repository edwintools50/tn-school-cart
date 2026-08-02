/**
 * Bubble-grid geometry for sheets produced by generateOmr.ts (the OMR Sheet
 * Builder). This module reproduces the same math but returns bubble
 * coordinates (in PDF points, origin top-left of the A4 page) instead of
 * drawing them, so a scanned/photographed copy of the same sheet can be read
 * back at the exact positions it was printed at.
 *
 * Keep PAGE_WIDTH/PAGE_HEIGHT/MARGIN and every offset below in sync with
 * generateOmr.ts if that file's layout ever changes. Ported verbatim from
 * the OMNI OMR Suite desktop app's evaluator/omrLayout.js — do not change
 * the math itself without re-verifying against a real printed+scanned sheet.
 */

export const PAGE_WIDTH = 595.28; // A4 pt
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 28;
export const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

// Fixed block heights from generateOmr.ts (drawInstructionsAndLegend,
// drawCandidateDetails) and the footer reserved at the bottom of the page.
const INSTRUCTIONS_LEGEND_H = 92;
const CANDIDATE_DETAILS_H = 172;
const FOOTER_H = 34;

export type Subject = { name: string; count: number };

export function getResponseGridBounds() {
  const gridTop = 62 + INSTRUCTIONS_LEGEND_H + 6 + CANDIDATE_DETAILS_H + 8; // = 340
  const gridBottom = PAGE_HEIGHT - MARGIN - FOOTER_H - 8; // = 771.89
  return { gridTop, gridBottom };
}

// Which subject a given absolute question number falls under, given the
// same [{name, count}] list used everywhere else (Sheet Builder sections /
// Evaluate settings). Shared by the response-grid layout below and the
// report-card generator's subject-wise breakdown.
export function subjectForQuestion(subjects: Subject[], qAbs: number): string | null {
  const activeSubjects = subjects.filter((s) => s.count > 0);
  let cursor = 1;
  for (const s of activeSubjects) {
    if (qAbs >= cursor && qAbs < cursor + s.count) return s.name;
    cursor += s.count;
  }
  return activeSubjects.length ? activeSubjects[activeSubjects.length - 1].name : null;
}

export type ResponseBubble = {
  qNum: number;
  subject: string | null;
  optionIndex: number;
  optionLetter: string;
  cx: number;
  cy: number;
  r: number;
};

/**
 * subjects: [{ name, count }] in the same order used to generate the sheet
 * (e.g. Physics/Chemistry/Biology). Only subjects with count > 0 matter.
 * Returns a flat list of bubbles plus the column layout, mirroring
 * drawResponsesGrid()'s math exactly.
 */
export function getResponseGridLayout(subjects: Subject[]) {
  const activeSubjects = subjects.filter((s) => s.count > 0);
  const { gridTop, gridBottom } = getResponseGridBounds();
  const availableHeight = gridBottom - gridTop;
  const headerH = 16;
  const minPitch = 11.2;
  const maxPitch = 24;
  const total = activeSubjects.reduce((s, sub) => s + sub.count, 0);

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

  function subjectAt(qAbs: number): string | null {
    let cursor = 1;
    for (const s of activeSubjects) {
      if (qAbs >= cursor && qAbs < cursor + s.count) return s.name;
      cursor += s.count;
    }
    return activeSubjects.length ? activeSubjects[activeSubjects.length - 1].name : null;
  }

  const bubbles: ResponseBubble[] = [];
  const columns: { colX: number; colStartQ: number; colCount: number }[] = [];
  for (let c = 0; c < numColumns; c++) {
    const colX = MARGIN + c * (colWidth + colGap);
    const colStartQ = 1 + c * rowsPerColumn;
    const colCount = Math.min(rowsPerColumn, total - c * rowsPerColumn);
    columns.push({ colX, colStartQ, colCount });

    for (let r = 0; r < colCount; r++) {
      const qNum = colStartQ + r;
      const rowY = gridTop + headerH + r * rowPitch;
      const subject = subjectAt(qNum);
      OPTION_LETTERS.forEach((letter, i) => {
        const bx = colX + qLabelWidth + bubblePitch * i + bubblePitch / 2;
        const by = rowY + rowPitch / 2;
        bubbles.push({ qNum, subject, optionIndex: i, optionLetter: letter, cx: bx, cy: by, r: bubbleR });
      });
    }
  }

  return { numColumns, rowsPerColumn, rowPitch, colWidth, bubbleR, total, columns, bubbles };
}

export type RollNumberBubble = { position: number; digit: number; cx: number; cy: number; r: number };

/**
 * Roll-number digit-in-bubble grid from drawCandidateDetails(): 8 digit
 * columns, each with bubbles for digits 0-9 stacked vertically.
 */
export function getRollNumberGridLayout() {
  const candidateDetailsY = 62 + INSTRUCTIONS_LEGEND_H + 6; // y passed into drawCandidateDetails = 160
  const rnX = MARGIN + 8;
  const rnY = candidateDetailsY + 8;
  const numDigits = 8;
  const colW = 20.5;
  const boxRowH = 15;
  const bubbleTop = rnY + 13 + boxRowH + 4;
  const bR = 5.6;
  const pitch = 12.4;

  const bubbles: RollNumberBubble[] = [];
  for (let digit = 0; digit <= 9; digit++) {
    for (let d = 0; d < numDigits; d++) {
      const cx = rnX + d * colW + (colW - 2.5) / 2;
      const cy = bubbleTop + digit * pitch + bR;
      bubbles.push({ position: d, digit, cx, cy, r: bR });
    }
  }
  return { numDigits, bubbles };
}

export type BookletCodeBubble = { series: string; number: string; cx: number; cy: number; r: number };

/**
 * Test Booklet Code grid from drawCandidateDetails(): a 4 (series letter
 * P/Q/R/S) x 4 (code number 1-4) bubble grid. The student marks exactly one
 * cell. Used for multi-set answer keys — the series letter identifies which
 * shuffled question paper (Set P/Q/R/S) this sheet is, so the right answer
 * key can be applied automatically. The header-row number bubbles (1-4,
 * pre-printed labels) are NOT included here since they're static column
 * headers, not something the student marks.
 */
export const BOOKLET_SERIES_LETTERS = ["P", "Q", "R", "S"] as const;
export const BOOKLET_CODE_NUMBERS = ["1", "2", "3", "4"] as const;

export function getBookletCodeGridLayout() {
  const candidateDetailsY = 62 + INSTRUCTIONS_LEGEND_H + 6; // = 160, same as getRollNumberGridLayout
  const rnX = MARGIN + 8;
  const rnY = candidateDetailsY + 8;
  const numDigits = 8;
  const colW = 20.5;
  const bcX = rnX + numDigits * colW + 16;
  const bcColW = 16.5;
  const bcLabelW = 13;
  const bR = 5.6;

  const bubbles: BookletCodeBubble[] = [];
  BOOKLET_SERIES_LETTERS.forEach((letter, r) => {
    const ry = rnY + 32 + r * 13.5;
    BOOKLET_CODE_NUMBERS.forEach((n, c) => {
      const cx = bcX + bcLabelW + c * bcColW + bcColW / 2;
      bubbles.push({ series: letter, number: n, cx, cy: ry, r: bR });
    });
  });
  return { bubbles };
}
