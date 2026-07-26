"use server";

import crypto from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { Role, TeachingSubject, CoachingMode, CompetitiveExam } from "@/generated/prisma/enums";
import { uploadPhoto, uploadDocument } from "@/lib/blob";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp } from "@/lib/request-ip";
import { checkRateLimit } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type ActionState = { error?: string } | undefined;

const baseSchema = {
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
  z.object({
    role: z.literal(Role.COACHING_CENTRE),
    ...baseSchema,
    businessName: z.string().trim().min(2, "Coaching centre name is required"),
    serviceArea: z.string().trim().min(2, "District is required"),
    examsOffered: z.array(z.enum(CompetitiveExam)).min(1, "Select at least one exam you coach for"),
    coachingMode: z.enum(CoachingMode),
  }),
]);

function redirectForRole(role: string): never {
  if (role === Role.ADMIN) redirect("/admin");
  if (role === Role.SUPPLIER) redirect("/dashboard/supplier");
  if (role === Role.WORKER) redirect("/dashboard/worker");
  if (role === Role.TEACHER) redirect("/dashboard/teacher");
  if (role === Role.COACHING_CENTRE) redirect("/jobs/mine");
  redirect("/marketplace");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const rate = await checkRateLimit(ip, "register", { max: 5, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many accounts created from this connection. Try again in ${minutes} minute(s).` };
  }

  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  // Coaching Centre "exams offered" is a checkbox group — multiple entries
  // share the same form field name, so Object.fromEntries above would only
  // keep the last one. Pull the full list explicitly for that role.
  if (raw.role === Role.COACHING_CENTRE) {
    raw.examsOffered = formData.getAll("examsOffered");
  }
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
  if (data.role === Role.COACHING_CENTRE) {
    const centrePhoto = formData.get("centrePhoto") as File | null;
    try {
      verificationPhotoUrl = await uploadPhoto(centrePhoto, "coaching-centre-verification");
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
        data.role === Role.SUPPLIER || data.role === Role.WORKER || data.role === Role.COACHING_CENTRE
          ? data.businessName
          : undefined,
      serviceArea:
        data.role === Role.SUPPLIER ||
        data.role === Role.WORKER ||
        data.role === Role.TEACHER ||
        data.role === Role.COACHING_CENTRE
          ? data.serviceArea
          : undefined,
      qualification: data.role === Role.TEACHER ? data.qualification : undefined,
      subjectSpecialization: data.role === Role.TEACHER ? data.subjectSpecialization : undefined,
      experienceYears: data.role === Role.TEACHER ? data.experienceYears : undefined,
      resumeUrl,
      examsOffered: data.role === Role.COACHING_CENTRE ? data.examsOffered : undefined,
      coachingMode: data.role === Role.COACHING_CENTRE ? data.coachingMode : undefined,
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
  const ip = await getClientIp();
  // Keyed by IP+email, not IP alone — a school office or shared campus
  // network can put many different staff behind one public IP, and a pure
  // per-IP limit would let one person's failed attempts lock everyone else
  // on that connection out of their own, unrelated accounts.
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const rate = await checkRateLimit(`${ip}:${emailRaw}`, "login", { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many login attempts. Try again in ${minutes} minute(s).` };
  }

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
  const ip = await getClientIp();
  // Same reasoning as login: key by IP+email so one shared school/office
  // connection can't have one person's repeated reset requests block
  // everyone else on it from requesting their own.
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const rate = await checkRateLimit(`${ip}:${emailRaw}`, "forgot-password", { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many reset requests. Try again in ${minutes} minute(s).` };
  }

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
  password: z.string().min(8, "Password must be at least 8 characters"),
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
