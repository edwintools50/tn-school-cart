"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadDocument } from "@/lib/blob";

export type ActionState = { error?: string } | undefined;

export async function updateResumeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["TEACHER"]);

  let resumeUrl: string | undefined;
  try {
    resumeUrl = await uploadDocument(formData.get("resume") as File | null, "teacher-resumes");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Resume upload failed." };
  }
  if (!resumeUrl) {
    return { error: "Please choose a PDF file to upload." };
  }

  await db.user.update({ where: { id: user.id }, data: { resumeUrl } });

  revalidatePath("/dashboard/teacher");
  return undefined;
}
