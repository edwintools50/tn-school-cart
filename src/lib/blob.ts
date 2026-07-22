import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024;
// Kept under the 4mb Server Action body limit (next.config.ts), minus
// multipart overhead and the other form fields sent alongside the file.
const DIGITAL_MAX_SIZE = 3.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const ALLOWED_DIGITAL_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

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

export async function uploadDigitalFile(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_DIGITAL_TYPES.includes(file.type)) {
    throw new Error("Digital file must be a PDF, ZIP, DOC, DOCX, PPT, or PPTX.");
  }
  if (file.size > DIGITAL_MAX_SIZE) {
    throw new Error("Digital file must be smaller than 3.5MB.");
  }
  const blob = await put(`${folder}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}
