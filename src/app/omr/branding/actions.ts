"use server";

import Jimp from "jimp";
import { revalidatePath } from "next/cache";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { uploadOmrLogo, deleteOmrBlob } from "@/lib/omr/storage";

const DEFAULT_PRIMARY_COLOR = "#1E3A8A";
const MAX_INSTITUTE_NAME_LENGTH = 48; // keeps the centered masthead text from overflowing past the corner logo
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export type BrandingActionState = { error?: string; saved?: boolean } | undefined;

export async function updateBrandingAction(
  _prevState: BrandingActionState,
  formData: FormData
): Promise<BrandingActionState> {
  const user = await requireOmrAccess();

  const instituteName = String(formData.get("instituteName") || "").trim().slice(0, MAX_INSTITUTE_NAME_LENGTH);
  const primaryColorRaw = String(formData.get("primaryColor") || "");
  const primaryColor = HEX_COLOR_RE.test(primaryColorRaw) ? primaryColorRaw : DEFAULT_PRIMARY_COLOR;

  const existing = await db.omrBranding.findUnique({ where: { ownerId: user.id } });

  let logoUrl = existing?.logoUrl ?? null;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > 3 * 1024 * 1024) {
      return { error: "Logo image is too large (max 3MB)." };
    }
    let normalizedBuffer: Buffer;
    try {
      const inputBuffer = Buffer.from(await logoFile.arrayBuffer());
      // Normalizes any uploaded image (PNG/JPG/WEBP) to a small square PNG —
      // keeps the PDF embed size small and gives a predictable format to
      // hand straight to pdfkit's doc.image().
      const img = await Jimp.read(inputBuffer);
      img.contain(240, 240, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
      normalizedBuffer = await img.getBufferAsync("image/png");
    } catch {
      return { error: "Couldn't read that image — try a JPG, PNG, or WEBP file." };
    }
    const newLogoUrl = await uploadOmrLogo(normalizedBuffer, user.id);
    if (existing?.logoUrl) await deleteOmrBlob(existing.logoUrl);
    logoUrl = newLogoUrl;
  }

  await db.omrBranding.upsert({
    where: { ownerId: user.id },
    create: { ownerId: user.id, instituteName: instituteName || null, primaryColor, logoUrl },
    update: { instituteName: instituteName || null, primaryColor, logoUrl },
  });

  revalidatePath("/omr/branding");
  return { saved: true };
}

export async function removeLogoAction() {
  const user = await requireOmrAccess();
  const existing = await db.omrBranding.findUnique({ where: { ownerId: user.id } });
  if (!existing?.logoUrl) return;

  await deleteOmrBlob(existing.logoUrl);
  await db.omrBranding.update({ where: { ownerId: user.id }, data: { logoUrl: null } });
  revalidatePath("/omr/branding");
}
