import "server-only";
import { put, del } from "@vercel/blob";

// The desktop app persisted everything to disk next to the exe (see the
// port's technical notes) — every one of those writes becomes a Blob upload
// here instead, scoped under the owning user's id so one buyer's sheets/
// scans/branding never collide with another's.

function safeFileName(name: string): string {
  const trimmed = name.trim().slice(-100);
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "file";
}

async function uploadOmrBuffer(
  buffer: Buffer,
  opts: { folder: string; filename: string; contentType: string }
): Promise<string> {
  const blob = await put(`omr/${opts.folder}/${safeFileName(opts.filename)}`, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: opts.contentType,
  });
  return blob.url;
}

/** A generated single/batch OMR sheet PDF (Sheet Builder). */
export async function uploadOmrSheetPdf(buffer: Buffer, ownerId: string, filename: string): Promise<string> {
  return uploadOmrBuffer(buffer, { folder: `${ownerId}/sheets`, filename, contentType: "application/pdf" });
}

/** The raw photo/scan a user uploaded of a filled-in sheet, kept permanently alongside its result. */
export async function uploadOmrScanImage(
  buffer: Buffer,
  ownerId: string,
  contentType: string
): Promise<string> {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return uploadOmrBuffer(buffer, { folder: `${ownerId}/uploads`, filename: `scan.${ext}`, contentType });
}

/** The graded overlay (green/red/amber rings) built from a scan, always PNG. */
export async function uploadOmrOverlayImage(buffer: Buffer, ownerId: string): Promise<string> {
  return uploadOmrBuffer(buffer, { folder: `${ownerId}/uploads`, filename: "overlay.png", contentType: "image/png" });
}

/** A branded PDF report card for one result. */
export async function uploadOmrReportCard(buffer: Buffer, ownerId: string, filename: string): Promise<string> {
  return uploadOmrBuffer(buffer, { folder: `${ownerId}/report-cards`, filename, contentType: "application/pdf" });
}

/** Institute logo for white-label branding, always normalized to PNG before this is called. */
export async function uploadOmrLogo(buffer: Buffer, ownerId: string): Promise<string> {
  return uploadOmrBuffer(buffer, { folder: `${ownerId}/branding`, filename: "logo.png", contentType: "image/png" });
}

/** Best-effort delete — e.g. replacing a logo. Never throws; a stray orphaned blob isn't worth failing the request over. */
export async function deleteOmrBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (e) {
    console.warn("[omr storage] Failed to delete blob:", url, e);
  }
}
