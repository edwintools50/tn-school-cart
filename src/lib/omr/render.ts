/**
 * Builds a human-checkable overlay image: the warped/aligned canonical sheet
 * with each detected mark circled (green = matches answer key, red = wrong,
 * amber = blank/ambiguous) so a teacher can quickly spot-check a misread.
 * Ported verbatim from OMNI OMR Suite's evaluator/render.js.
 */
import Jimp from "jimp";
import type { getResponseGridLayout } from "./omrLayout";
import type { ScoredQuestionDetail } from "./types";

type JimpImage = InstanceType<typeof Jimp>;
type ResponseGridLayout = ReturnType<typeof getResponseGridLayout>;

function grayBufferToJimp(grayBuffer: Uint8ClampedArray, width: number, height: number): JimpImage {
  const img = new Jimp(width, height, 0xffffffff);
  for (let i = 0; i < grayBuffer.length; i++) {
    const g = grayBuffer[i];
    img.bitmap.data[i * 4] = g;
    img.bitmap.data[i * 4 + 1] = g;
    img.bitmap.data[i * 4 + 2] = g;
    img.bitmap.data[i * 4 + 3] = 255;
  }
  return img;
}

function drawRing(img: JimpImage, cx: number, cy: number, rOuter: number, rInner: number, [r, g, b]: [number, number, number]) {
  const { width, height, data } = img.bitmap;
  const x0 = Math.max(0, Math.floor(cx - rOuter));
  const x1 = Math.min(width - 1, Math.ceil(cx + rOuter));
  const y0 = Math.max(0, Math.floor(cy - rOuter));
  const y1 = Math.min(height - 1, Math.ceil(cy + rOuter));
  const rO2 = rOuter * rOuter;
  const rI2 = rInner * rInner;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= rO2 && d2 >= rI2) {
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }
}

const COLOR_CORRECT: [number, number, number] = [0, 170, 0];
const COLOR_WRONG: [number, number, number] = [220, 0, 0];
const COLOR_BLANK: [number, number, number] = [230, 160, 0];

/**
 * details: scoring's scoreExam(...).details.
 * gridLayout: omrLayout's getResponseGridLayout(...) result.
 * scale: PDF-points -> pixels factor (scanner's canonicalPixelSize(dpi).scale).
 */
export function buildOverlayImage(
  grayBuffer: Uint8ClampedArray,
  width: number,
  height: number,
  gridLayout: ResponseGridLayout,
  details: ScoredQuestionDetail[],
  scale: number
): JimpImage {
  const img = grayBufferToJimp(grayBuffer, width, height);
  const detailByQ = new Map(details.map((d) => [d.qNum, d]));

  for (const b of gridLayout.bubbles) {
    const detail = detailByQ.get(b.qNum);
    if (!detail || detail.detected !== b.optionLetter) continue;
    const color = detail.outcome === "correct" ? COLOR_CORRECT : detail.outcome === "wrong" ? COLOR_WRONG : COLOR_BLANK;
    drawRing(img, b.cx * scale, b.cy * scale, b.r * scale + 2.5, b.r * scale - 0.5, color);
  }
  // Blank/multiple questions have no single detected spot to ring — that
  // stays visible in the results table instead, same as the original.

  return img;
}
