"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { generateOmrPdf, generateBatchOmrPdf, type GenerateSheetInput } from "@/lib/omr/generateOmr";
import { uploadOmrSheetPdf } from "@/lib/omr/storage";
import { parseRosterCsv } from "@/lib/omr/roster";
import { getActiveBranding } from "@/lib/omr/branding";

export type SheetActionState =
  | { error: string; sheetUrl?: undefined }
  | { error?: undefined; sheetUrl: string; sheetTitle: string; studentCount?: number }
  | undefined;

const ROSTER_MAX_BYTES = 2 * 1024 * 1024;
const MAX_BATCH_STUDENTS = 500;

const MAX_SECTIONS = 5;
const sectionCount = z.coerce.number().int().min(0).max(200).optional().default(0);
const sectionName = z.string().trim().max(40).optional().default("");

const sheetFieldsSchema = z.object({
  examTitle: z.string().trim().max(200).optional().default(""),
  section1Name: sectionName,
  section2Name: sectionName,
  section3Name: sectionName,
  section4Name: sectionName,
  section5Name: sectionName,
  section1Count: sectionCount,
  section2Count: sectionCount,
  section3Count: sectionCount,
  section4Count: sectionCount,
  section5Count: sectionCount,
  instruction1: z.string().trim().max(300).optional().default(""),
  instruction2: z.string().trim().max(300).optional().default(""),
  instruction3: z.string().trim().max(300).optional().default(""),
  instruction4: z.string().trim().max(300).optional().default(""),
  instruction5: z.string().trim().max(300).optional().default(""),
});

function toGenerateInput(data: z.infer<typeof sheetFieldsSchema>): GenerateSheetInput {
  const sections = [1, 2, 3, 4, 5]
    .map((i) => ({
      name: data[`section${i}Name` as `section${1 | 2 | 3 | 4 | 5}Name`],
      count: data[`section${i}Count` as `section${1 | 2 | 3 | 4 | 5}Count`],
    }))
    .filter((s) => s.count > 0)
    .slice(0, MAX_SECTIONS);
  const total = sections.reduce((sum, s) => sum + s.count, 0);
  if (total <= 0) throw new Error("Add at least one question across the sections.");
  if (total > 200) throw new Error("This sheet layout supports up to 200 questions in total.");
  return {
    sections,
    examTitle: data.examTitle || undefined,
    instructions: [data.instruction1, data.instruction2, data.instruction3, data.instruction4, data.instruction5],
  };
}

export async function generateSheetAction(
  _prevState: SheetActionState,
  formData: FormData
): Promise<SheetActionState> {
  const user = await requireOmrAccess();
  const parsed = sheetFieldsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let input: GenerateSheetInput;
  try {
    input = toGenerateInput(parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input" };
  }

  const branding = await getActiveBranding(user.id);
  const { buffer } = await generateOmrPdf({ ...input, branding });
  const title = input.examTitle || "OMR Practice Sheet";
  const fileUrl = await uploadOmrSheetPdf(buffer, user.id, `${title}.pdf`);

  await db.omrGeneratedSheet.create({
    data: { ownerId: user.id, title, fileUrl, isBatch: false },
  });

  revalidatePath("/omr/sheet-builder");
  return { sheetUrl: fileUrl, sheetTitle: title };
}

const VALID_SET_LETTERS = ["P", "Q", "R", "S"];

export async function generateBatchSheetAction(
  _prevState: SheetActionState,
  formData: FormData
): Promise<SheetActionState> {
  const user = await requireOmrAccess();
  const parsed = sheetFieldsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let input: GenerateSheetInput;
  try {
    input = toGenerateInput(parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input" };
  }

  const file = formData.get("rosterFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a roster CSV file." };
  }
  if (file.size > ROSTER_MAX_BYTES) {
    return { error: "Roster file is too large (max 2MB)." };
  }

  const { roster, errors } = parseRosterCsv(await file.text());
  if (errors.length > 0) return { error: errors[0] };
  if (roster.length > MAX_BATCH_STUDENTS) {
    return { error: `Batch limit is ${MAX_BATCH_STUDENTS} students per file (this file has ${roster.length}).` };
  }

  const activeSetsRaw = String(formData.get("activeSets") || "P");
  const activeSets = [...new Set(activeSetsRaw.split(",").map((s) => s.trim().toUpperCase()).filter((s) => VALID_SET_LETTERS.includes(s)))];

  const branding = await getActiveBranding(user.id);
  const { buffer } = await generateBatchOmrPdf({
    ...input,
    branding,
    roster,
    activeSets: activeSets.length > 0 ? activeSets : ["P"],
  });
  const title = `${input.examTitle || "OMR Practice Sheet"} — Batch (${roster.length})`;
  const fileUrl = await uploadOmrSheetPdf(buffer, user.id, `${title}.pdf`);

  await db.omrGeneratedSheet.create({
    data: { ownerId: user.id, title, fileUrl, isBatch: true, studentCount: roster.length },
  });

  revalidatePath("/omr/sheet-builder");
  return { sheetUrl: fileUrl, sheetTitle: title, studentCount: roster.length };
}
