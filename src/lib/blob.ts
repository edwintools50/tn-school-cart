import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadPhoto(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_TYPES.includes(file.type)) {
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
