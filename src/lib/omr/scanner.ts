/**
 * Reads marked bubbles from a warped (axis-aligned) grayscale canonical
 * image, given bubble coordinates in PDF points from omrLayout.ts. Ported
 * verbatim from the OMNI OMR Suite desktop app's evaluator/scanner.js — the
 * detection thresholds below were tuned against real scanned/photographed
 * sheets, do not change them without re-verifying.
 */
import { PAGE_WIDTH, PAGE_HEIGHT } from "./omrLayout";
import type { ResponseBubble, RollNumberBubble, BookletCodeBubble } from "./omrLayout";

export const DEFAULT_DPI = 150; // canonical raster resolution used throughout the app
const PT_TO_PX = (dpi: number) => dpi / 72;

export function canonicalPixelSize(dpi = DEFAULT_DPI) {
  const scale = PT_TO_PX(dpi);
  return { width: Math.round(PAGE_WIDTH * scale), height: Math.round(PAGE_HEIGHT * scale), scale };
}

type GrayBuffer = Uint8ClampedArray | Uint8Array;

// Mean darkness (0 = white, 1 = solid black) of the disc of the given pixel
// radius centred at (cx, cy) in the grayscale buffer.
export function sampleFillRatio(
  grayBuffer: GrayBuffer,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radiusPx: number
): number {
  const sampleR = radiusPx * 0.72; // stay inside the printed ring, avoid edge/letter-glyph bias
  const x0 = Math.max(0, Math.floor(cx - sampleR));
  const x1 = Math.min(width - 1, Math.ceil(cx + sampleR));
  const y0 = Math.max(0, Math.floor(cy - sampleR));
  const y1 = Math.min(height - 1, Math.ceil(cy + sampleR));

  let sum = 0;
  let n = 0;
  const r2 = sampleR * sampleR;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        sum += grayBuffer[y * width + x];
        n++;
      }
    }
  }
  if (n === 0) return 0;
  const meanGray = sum / n; // 0..255
  return 1 - meanGray / 255; // 0 (white) .. 1 (black)
}

type ReadOpts = { dpi?: number; filledThreshold?: number; separationMargin?: number };

export type ResponseReading = {
  detected: string | null;
  status: "answered" | "unattempted" | "multiple";
  fills: Record<string, number>;
};

/**
 * responseBubbles: flat list from omrLayout.getResponseGridLayout().bubbles
 * (each has qNum, optionLetter, cx, cy, r in PDF points).
 * Returns { [qNum]: { detected, status, fills: {A,B,C,D} } }.
 */
export function readResponses(
  grayBuffer: GrayBuffer,
  width: number,
  height: number,
  responseBubbles: ResponseBubble[],
  opts: ReadOpts = {}
): Record<number, ResponseReading> {
  const dpi = opts.dpi || DEFAULT_DPI;
  const scale = PT_TO_PX(dpi);
  const filledThreshold = opts.filledThreshold ?? 0.28;
  const separationMargin = opts.separationMargin ?? 0.1;

  const byQuestion = new Map<number, { letter: string; fill: number }[]>();
  for (const b of responseBubbles) {
    if (!byQuestion.has(b.qNum)) byQuestion.set(b.qNum, []);
    const cx = b.cx * scale;
    const cy = b.cy * scale;
    const radiusPx = b.r * scale;
    const fill = sampleFillRatio(grayBuffer, width, height, cx, cy, radiusPx);
    byQuestion.get(b.qNum)!.push({ letter: b.optionLetter, fill });
  }

  const answers: Record<number, ResponseReading> = {};
  for (const [qNum, options] of byQuestion.entries()) {
    const sorted = [...options].sort((a, b) => b.fill - a.fill);
    const fills = Object.fromEntries(options.map((o) => [o.letter, Number(o.fill.toFixed(3))]));
    const top1 = sorted[0];
    const top2 = sorted[1];

    let status: ResponseReading["status"];
    let detected: string | null;
    if (top1.fill < filledThreshold) {
      status = "unattempted";
      detected = null;
    } else if (top2 && top1.fill - top2.fill < separationMargin) {
      status = "multiple";
      detected = null;
    } else {
      status = "answered";
      detected = top1.letter;
    }
    answers[qNum] = { detected, status, fills };
  }

  return answers;
}

/**
 * rollNumberBubbles: flat list from omrLayout.getRollNumberGridLayout().bubbles
 * (each has position 0-7, digit 0-9, cx, cy, r in PDF points).
 * Returns the best-effort detected roll number string (may contain "?" for
 * ambiguous/blank positions) plus per-position confidence detail.
 */
export function readRollNumber(
  grayBuffer: GrayBuffer,
  width: number,
  height: number,
  rollNumberBubbles: RollNumberBubble[],
  opts: ReadOpts = {}
) {
  const dpi = opts.dpi || DEFAULT_DPI;
  const scale = PT_TO_PX(dpi);
  const filledThreshold = opts.filledThreshold ?? 0.28;
  const separationMargin = opts.separationMargin ?? 0.1;

  const byPosition = new Map<number, { digit: number; fill: number }[]>();
  for (const b of rollNumberBubbles) {
    if (!byPosition.has(b.position)) byPosition.set(b.position, []);
    const cx = b.cx * scale;
    const cy = b.cy * scale;
    const radiusPx = b.r * scale;
    const fill = sampleFillRatio(grayBuffer, width, height, cx, cy, radiusPx);
    byPosition.get(b.position)!.push({ digit: b.digit, fill });
  }

  const positions = [...byPosition.keys()].sort((a, b) => a - b);
  let rollNumber = "";
  const detail: { position: number; digit: string; fill: number }[] = [];
  for (const pos of positions) {
    const options = byPosition.get(pos)!;
    const sorted = [...options].sort((a, b) => b.fill - a.fill);
    const top1 = sorted[0];
    const top2 = sorted[1];
    let digitChar = "?";
    if (top1.fill >= filledThreshold && (!top2 || top1.fill - top2.fill >= separationMargin)) {
      digitChar = String(top1.digit);
    }
    rollNumber += digitChar;
    detail.push({ position: pos, digit: digitChar, fill: Number(top1.fill.toFixed(3)) });
  }

  return { rollNumber, detail };
}

/**
 * bookletBubbles: flat list from omrLayout.getBookletCodeGridLayout().bubbles
 * (each has series "P"|"Q"|"R"|"S", number "1"-"4", cx, cy, r in PDF points).
 * Exactly one cell should be marked across the whole 16-cell grid (unlike
 * roll number, which has one mark per digit-column) — this picks the single
 * darkest cell above threshold, not per-column.
 * Returns { series, number, code, detected, detail } — series/number/code
 * are null and detected is false if no cell is confidently marked or two
 * cells are too close to call.
 */
export function readBookletCode(
  grayBuffer: GrayBuffer,
  width: number,
  height: number,
  bookletBubbles: BookletCodeBubble[],
  opts: ReadOpts = {}
) {
  const dpi = opts.dpi || DEFAULT_DPI;
  const scale = PT_TO_PX(dpi);
  const filledThreshold = opts.filledThreshold ?? 0.28;
  const separationMargin = opts.separationMargin ?? 0.1;

  const scored = bookletBubbles.map((b) => {
    const cx = b.cx * scale;
    const cy = b.cy * scale;
    const radiusPx = b.r * scale;
    const fill = sampleFillRatio(grayBuffer, width, height, cx, cy, radiusPx);
    return { series: b.series, number: b.number, fill: Number(fill.toFixed(3)) };
  });

  const sorted = [...scored].sort((a, b) => b.fill - a.fill);
  const top1 = sorted[0];
  const top2 = sorted[1];

  let detected = false;
  let series: string | null = null;
  let number: string | null = null;
  if (top1 && top1.fill >= filledThreshold && (!top2 || top1.fill - top2.fill >= separationMargin)) {
    detected = true;
    series = top1.series;
    number = top1.number;
  }

  return {
    detected,
    series,
    number,
    code: detected ? series! + number! : null,
    detail: scored,
  };
}
