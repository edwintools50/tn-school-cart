"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { readSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation don't match.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireUser();

  const rate = await checkRateLimit(user.id, "change-password", { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many attempts. Try again in ${minutes} minute(s).` };
  }

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Standard practice: a password change should immediately sign out any
  // other device using the old credentials, not just the one that changed
  // it — otherwise someone who had the old password stays logged in.
  const session = await readSession();
  if (session) {
    await db.session.deleteMany({ where: { userId: user.id, id: { not: session.sessionId } } });
  }

  return { success: true };
}

export type LogoutOtherDevicesState = { success?: boolean; count?: number } | undefined;

export async function logoutOtherDevicesAction(): Promise<LogoutOtherDevicesState> {
  const user = await requireUser();
  const session = await readSession();
  if (!session) redirect("/login");

  const result = await db.session.deleteMany({
    where: { userId: user.id, id: { not: session.sessionId } },
  });

  revalidatePath("/account/settings");
  return { success: true, count: result.count };
}
