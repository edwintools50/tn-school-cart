"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";

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
]);

function redirectForRole(role: string): never {
  if (role === Role.ADMIN) redirect("/admin");
  if (role === Role.SUPPLIER) redirect("/dashboard/supplier");
  if (role === Role.WORKER) redirect("/dashboard/worker");
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
      businessName:
        data.role === Role.SUPPLIER || data.role === Role.WORKER
          ? data.businessName
          : undefined,
      serviceArea:
        data.role === Role.SUPPLIER || data.role === Role.WORKER
          ? data.serviceArea
          : undefined,
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
