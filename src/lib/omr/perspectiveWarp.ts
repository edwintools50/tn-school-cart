/**
 * Pure-JS perspective ("4 corners") warp — no OpenCV / native deps needed.
 * Solves a planar homography from 4 point correspondences via Gaussian
 * elimination, then inverse-warps (destination -> source, bilinear sampled)
 * to produce a canonical, axis-aligned grayscale image of the OMR sheet.
 * Ported verbatim from the OMNI OMR Suite desktop app's
 * evaluator/perspectiveWarp.js.
 */

export type Point = [number, number];

// Solves for the 3x3 homography H (h[8] = 1) such that, for each i,
// toPts[i] ~= H * fromPts[i] in homogeneous coordinates.
// Returns a flat 9-element array [h0..h8] (row-major 3x3).
export function solveHomography(fromPts: Point[], toPts: Point[]): number[] {
  if (fromPts.length !== 4 || toPts.length !== 4) {
    throw new Error("solveHomography needs exactly 4 point correspondences");
  }

  // Build the 8x9 augmented matrix for the 8 unknowns h0..h7 (h8 fixed to 1).
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = fromPts[i];
    const [u, v] = toPts[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }

  const h = gaussianSolve(A, b);
  h.push(1);
  return h; // [h0,h1,h2,h3,h4,h5,h6,h7,1]
}

// Solves the linear system A*x = b (A is n x n, b length n) via Gaussian
// elimination with partial pivoting. Returns x as a plain array.
export function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > maxAbs) {
        maxAbs = Math.abs(M[r][col]);
        pivotRow = r;
      }
    }
    if (maxAbs < 1e-12) throw new Error("Singular matrix — degenerate corner points");
    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const pivotVal = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pivotVal;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  return M.map((row) => row[n]);
}

export function applyHomography(h: number[], x: number, y: number): Point {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}

// Bilinear-sample the grayscale luminance of an RGBA bitmap at (x, y).
// Returns null if the point falls outside the source image bounds.
function sampleGray(
  bitmap: { width: number; height: number; data: Uint8Array | Buffer },
  x: number,
  y: number
): number | null {
  const { width, height, data } = bitmap;
  if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return null;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;

  function lum(px: number, py: number): number {
    const idx = (py * width + px) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const top = lum(x0, y0) * (1 - fx) + lum(x1, y0) * fx;
  const bottom = lum(x0, y1) * (1 - fx) + lum(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Inverse-warps sourceJimpImage so that the quadrilateral srcCorners
 * (top-left, top-right, bottom-right, bottom-left, in source pixel coords)
 * becomes the full destWidth x destHeight canonical rectangle.
 * Returns a Uint8ClampedArray of grayscale values, row-major, length
 * destWidth * destHeight. Points landing outside the source image are
 * filled with 255 (white).
 */
export function warpToGrayscale(
  sourceJimpImage: { bitmap: { width: number; height: number; data: Uint8Array | Buffer } },
  srcCorners: Point[],
  destWidth: number,
  destHeight: number
): Uint8ClampedArray {
  const destCorners: Point[] = [
    [0, 0],
    [destWidth - 1, 0],
    [destWidth - 1, destHeight - 1],
    [0, destHeight - 1],
  ];
  // Solve dest -> src directly (avoids needing a separate matrix inverse).
  const hDestToSrc = solveHomography(destCorners, srcCorners);

  const out = new Uint8ClampedArray(destWidth * destHeight);
  const bitmap = sourceJimpImage.bitmap;

  for (let v = 0; v < destHeight; v++) {
    for (let u = 0; u < destWidth; u++) {
      const [x, y] = applyHomography(hDestToSrc, u, v);
      const gray = sampleGray(bitmap, x, y);
      out[v * destWidth + u] = gray === null ? 255 : gray;
    }
  }

  return out;
}
