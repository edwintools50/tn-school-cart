"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { Role, TeachingSubject, GigCategory, ProductCategory } from "@/generated/prisma/enums";
import { generateOtp, hashOtp, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { sendQuickSignupOtpEmail } from "@/lib/email";
import { getClientIp } from "@/lib/request-ip";
import { checkRateLimit } from "@/lib/rate-limit";

export type JoinState =
  | { step: "form"; role: Role; error?: string }
  | { step: "otp"; role: Role; email: string; name: string; error?: string }
  | { step: "done"; role: Role };

const baseJoinSchema = {
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  district: z.string().trim().min(2, "District is required"),
};

const joinSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(Role.TEACHER),
    ...baseJoinSchema,
    qualification: z.string().trim().min(2, "Qualification is required"),
    subjectSpecialization: z.enum(TeachingSubject),
    experienceYears: z.coerce.number().int().min(0, "Experience can't be negative"),
  }),
  z.object({
    role: z.literal(Role.WORKER),
    ...baseJoinSchema,
    businessName: z.string().trim().min(2, "Your name / business name is required"),
    gigCategory: z.enum(GigCategory),
    offeringTitle: z.string().trim().min(2, "Describe what you offer"),
    offeringDescription: z.string().trim().min(10, "Add a short description (10+ characters)"),
    offeringPrice: z.coerce.number().positive().optional().or(z.literal("")),
  }),
  z.object({
    role: z.literal(Role.SUPPLIER),
    ...baseJoinSchema,
    businessName: z.string().trim().min(2, "Business name is required"),
    productCategory: z.enum(ProductCategory),
    offeringTitle: z.string().trim().min(2, "Product name is required"),
    offeringDescription: z.string().trim().min(10, "Add a short description (10+ characters)"),
    offeringPrice: z.coerce.number().positive("Enter a valid price"),
    offeringUnit: z.string().trim().min(1).default("piece"),
    offeringStock: z.coerce.number().int().positive("Enter how many you have in stock"),
  }),
]);

function roleLabel(role: Role): string {
  if (role === Role.TEACHER) return "teacher";
  if (role === Role.WORKER) return "gig worker";
  return "vendor";
}

async function handleRequestOtp(role: Role, formData: FormData): Promise<JoinState> {
  const ip = await getClientIp();
  const rate = await checkRateLimit(ip, "quick-signup-otp", { max: 8, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many sign-up attempts from this connection. Try again in ${minutes} minute(s).`, step: "form", role };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", step: "form", role };
  }
  const data = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: "An account with this email already exists. Log in instead.", step: "form", role };
  }

  const existingQS = await db.quickSignup.findUnique({
    where: { email_role: { email: data.email, role: data.role } },
  });
  if (existingQS?.status === "APPROVED") {
    return { error: `You're already listed as a ${roleLabel(role)} with this email.`, step: "form", role };
  }
  if (existingQS?.status === "PENDING_APPROVAL") {
    return { error: "Your details are verified and already waiting for review — no need to sign up again.", step: "form", role };
  }

  const code = generateOtp();
  const otpHash = hashOtp(code);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  const roleFields =
    data.role === Role.TEACHER
      ? {
          qualification: data.qualification,
          subjectSpecialization: data.subjectSpecialization,
          experienceYears: data.experienceYears,
          businessName: null,
          gigCategory: null,
          productCategory: null,
          offeringTitle: null,
          offeringDescription: null,
          offeringPrice: null,
          offeringUnit: null,
          offeringStock: null,
        }
      : data.role === Role.WORKER
        ? {
            businessName: data.businessName,
            gigCategory: data.gigCategory,
            offeringTitle: data.offeringTitle,
            offeringDescription: data.offeringDescription,
            offeringPrice: data.offeringPrice === "" ? null : (data.offeringPrice ?? null),
            offeringUnit: null,
            offeringStock: null,
            qualification: null,
            subjectSpecialization: null,
            experienceYears: null,
            productCategory: null,
          }
        : {
            businessName: data.businessName,
            productCategory: data.productCategory,
            offeringTitle: data.offeringTitle,
            offeringDescription: data.offeringDescription,
            offeringPrice: data.offeringPrice,
            offeringUnit: data.offeringUnit,
            offeringStock: data.offeringStock,
            qualification: null,
            subjectSpecialization: null,
            experienceYears: null,
            gigCategory: null,
          };

  await db.quickSignup.upsert({
    where: { email_role: { email: data.email, role: data.role } },
    create: {
      role: data.role,
      name: data.name,
      email: data.email,
      phone: data.phone,
      district: data.district,
      ...roleFields,
      otpHash,
      otpExpiresAt,
      status: "PENDING_VERIFICATION",
    },
    update: {
      name: data.name,
      phone: data.phone,
      district: data.district,
      ...roleFields,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      verifiedAt: null,
      status: "PENDING_VERIFICATION",
      rejectionNote: null,
    },
  });

  try {
    await sendQuickSignupOtpEmail(data.email, data.name, code);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send verification email.", step: "form", role };
  }

  return { step: "otp", role: data.role, email: data.email, name: data.name };
}

async function handleResendOtp(role: Role, formData: FormData): Promise<JoinState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "");

  const ip = await getClientIp();
  const rate = await checkRateLimit(`${ip}:${email}`, "quick-signup-resend", { max: 5, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) {
    return { error: "Too many resend requests. Try again later.", step: "otp", role, email, name };
  }

  const qs = await db.quickSignup.findUnique({ where: { email_role: { email, role } } });
  if (!qs || qs.status !== "PENDING_VERIFICATION") {
    return { error: "Sign-up session not found. Please start again.", step: "form", role };
  }

  const code = generateOtp();
  await db.quickSignup.update({
    where: { id: qs.id },
    data: { otpHash: hashOtp(code), otpExpiresAt: new Date(Date.now() + OTP_TTL_MS), otpAttempts: 0 },
  });

  try {
    await sendQuickSignupOtpEmail(email, name || qs.name, code);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to resend code.", step: "otp", role, email, name };
  }

  return { step: "otp", role, email, name: name || qs.name, error: "A new code was sent." };
}

async function handleVerifyOtp(role: Role, formData: FormData): Promise<JoinState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  const ip = await getClientIp();
  const rate = await checkRateLimit(`${ip}:${email}`, "quick-signup-verify", { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return { error: `Too many attempts. Try again in ${minutes} minute(s).`, step: "otp", role, email, name };
  }

  const qs = await db.quickSignup.findUnique({ where: { email_role: { email, role } } });
  if (!qs || qs.status !== "PENDING_VERIFICATION") {
    return { error: "Sign-up session not found or already used. Please start again.", step: "form", role };
  }
  if (qs.otpExpiresAt < new Date()) {
    return { error: "That code has expired. Request a new one.", step: "otp", role, email, name };
  }
  if (qs.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Please start again.", step: "form", role };
  }

  if (hashOtp(code) !== qs.otpHash) {
    await db.quickSignup.update({ where: { id: qs.id }, data: { otpAttempts: { increment: 1 } } });
    return { error: "Incorrect code. Please try again.", step: "otp", role, email, name };
  }

  await db.quickSignup.update({
    where: { id: qs.id },
    data: { status: "PENDING_APPROVAL", verifiedAt: new Date(), otpAttempts: 0 },
  });

  return { step: "done", role };
}

/** Single action for the whole 2-step flow — dispatches on the hidden "intent" field so one useActionState hook can drive the entire UI. */
export async function quickSignupAction(prevState: JoinState, formData: FormData): Promise<JoinState> {
  const intent = String(formData.get("intent") ?? "request");
  const role = String(formData.get("role") ?? prevState.role) as Role;

  if (intent === "verify") return handleVerifyOtp(role, formData);
  if (intent === "resend") return handleResendOtp(role, formData);
  return handleRequestOtp(role, formData);
}
