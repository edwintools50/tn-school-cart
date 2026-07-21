"use server";

import crypto from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { Role, TeachingSubject } from "@/generated/prisma/enums";
import { uploadPhoto, uploadDocument } from "@/lib/blob";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type ActionState = { error?: string } | undefined;

const baseSchema = {
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
};

const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(Role.PRINCIPAL),
    ...baseSchema,
    schoolName: z.string().trim().min(2, "School name is required"),
    udiseNumber: z
      .string()
      .trim()
      .regex(/^\d{11}$/, "UDISE number must be the 11-digit school code"),
    district: z.string().trim().min(2, "District is required"),
  }),
  z.object({
    role: z.literal(Role.SUPPLIER),
    ...baseSchema,
    businessName: z.string().trim().min(2, "Business name is required"),
    serviceArea: z.string().trim().min(2, "Service area is required"),
  }),
  z.object({
    role: z.literal(Role.WORKER),
    ...baseSchema,
    businessName: z.string().trim().min(2, "Your name / business name is required"),
    serviceArea: z.string().trim().min(2, "Service area is required"),
  }),
  z.object({
    role: z.literal(Role.TEACHER),
    ...baseSchema,
    qualification: z.string().trim().min(2, "Qualification is required"),
    subjectSpecialization: z.enum(TeachingSubject),
    experienceYears: z.coerce.number().int().min(0, "Experience can't be negative"),
    serviceArea: z.string().trim().min(2, "Preferred district is required"),
  }),
]);

function redirectForRole(role: string): never {
  if (role === Role.ADMIN) redirect("/admin");
  if (role === Role.SUPPLIER) redirect("/dashboard/supplier");
  if (role === Role.WORKER) redirect("/dashboard/worker");
  if (role === Role.TEACHER) redirect("/dashboard/teacher");
  redirect("/marketplace");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(data.password);

  let verificationPhotoUrl: string | undefined;
  if (data.role === Role.PRINCIPAL) {
    const schoolPhoto = formData.get("schoolPhoto") as File | null;
    try {
      verificationPhotoUrl = await uploadPhoto(schoolPhoto, "school-verification");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Photo upload failed." };
    }
  }

  let resumeUrl: string | undefined;
  if (data.role === Role.TEACHER) {
    const resume = formData.get("resume") as File | null;
    try {
      resumeUrl = await uploadDocument(resume, "teacher-resumes");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Resume upload failed." };
    }
  }

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      status: data.role === Role.PRINCIPAL ? "APPROVED" : "PENDING",
      schoolName: data.role === Role.PRINCIPAL ? data.schoolName : undefined,
      udiseNumber: data.role === Role.PRINCIPAL ? data.udiseNumber : undefined,
      district: data.role === Role.PRINCIPAL ? data.district : undefined,
      verificationPhotoUrl,
      businessName:
        data.role === Role.SUPPLIER || data.role === Role.WORKER
          ? data.businessName
          : undefined,
      serviceArea:
        data.role === Role.SUPPLIER || data.role === Role.WORKER || data.role === Role.TEACHER
          ? data.serviceArea
          : undefined,
      qualification: data.role === Role.TEACHER ? data.qualification : undefined,
      subjectSpecialization: data.role === Role.TEACHER ? data.subjectSpecialization : undefined,
      experienceYears: data.role === Role.TEACHER ? data.experienceYears : undefined,
      resumeUrl,
    },
  });

  await createSession(user.id);
  redirectForRole(user.role);
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: "Invalid email or password." };

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended. Contact TN School Cart support." };
  }

  await createSession(user.id);
  redirectForRole(user.role);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export type RequestResetState = { error?: string; success?: boolean } | undefined;

export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const parsed = requestResetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tnschoolcart.com";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to send reset email." };
    }
  }

  return { success: true };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset link is invalid."),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const user = await db.user.findUnique({ where: { resetTokenHash: tokenHash } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  redirect("/login");
}
