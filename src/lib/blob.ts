import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

export async function uploadPhoto(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Photo must be a JPG, PNG, or WEBP image.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Photo must be smaller than 5MB.");
  }
  const blob = await put(`${folder}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function uploadDocument(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error("Resume must be a PDF file.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Resume must be smaller than 5MB.");
  }
  const blob = await put(`${folder}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}
