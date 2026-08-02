import "server-only";
import { db } from "@/lib/db";
import type { Branding } from "./types";

/**
 * Resolves a user's saved OmrBranding row into the {instituteName,
 * primaryColor, logoBuffer} shape generateOmr.ts/reportCard.ts expect —
 * pdfkit's doc.image() needs raw bytes, not a URL, so the stored Blob
 * logoUrl is fetched here. Returns undefined (not a default-filled object)
 * when the user has no branding row yet, so callers/PDF generators fall
 * back to their own built-in defaults instead of an empty institute name.
 */
export async function getActiveBranding(ownerId: string): Promise<Branding | undefined> {
  const branding = await db.omrBranding.findUnique({ where: { ownerId } });
  if (!branding) return undefined;

  let logoBuffer: Buffer | null = null;
  if (branding.logoUrl) {
    try {
      const res = await fetch(branding.logoUrl);
      if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer());
    } catch {
      logoBuffer = null; // best-effort — sheet/report generation still works without a logo
    }
  }

  return {
    instituteName: branding.instituteName || null,
    primaryColor: branding.primaryColor,
    logoBuffer,
  };
}
