"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendQuickSignupApprovedEmail } from "@/lib/email";
import { Role } from "@/generated/prisma/enums";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function roleLabel(role: Role): string {
  if (role === Role.TEACHER) return "teacher";
  if (role === Role.WORKER) return "gig worker";
  return "vendor";
}

export async function approveUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  await db.user.update({
    where: { id: userId },
    data: { status: "APPROVED", rejectionNote: null },
  });
  revalidatePath("/admin/users");
}

export async function rejectUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const note = String(formData.get("note") ?? "").trim();
  await db.user.update({
    where: { id: userId },
    data: { status: "REJECTED", rejectionNote: note || null },
  });
  revalidatePath("/admin/users");
}

export async function suspendUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  revalidatePath("/admin/users");
}

export async function reinstateUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  await db.user.update({
    where: { id: userId },
    data: { status: "APPROVED", rejectionNote: null },
  });
  revalidatePath("/admin/users");
}

export async function approveProductAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  await db.product.update({
    where: { id: productId },
    data: { status: "APPROVED", rejectionNote: null },
  });
  revalidatePath("/admin/products");
}

export async function rejectProductAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const note = String(formData.get("note") ?? "").trim();
  await db.product.update({
    where: { id: productId },
    data: { status: "REJECTED", rejectionNote: note || "Does not meet listing guidelines." },
  });
  revalidatePath("/admin/products");
}

export async function approveServiceAction(formData: FormData) {
  await requireAdmin();
  const serviceId = String(formData.get("serviceId"));
  await db.gigService.update({
    where: { id: serviceId },
    data: { status: "APPROVED", rejectionNote: null },
  });
  revalidatePath("/admin/services");
}

export async function rejectServiceAction(formData: FormData) {
  await requireAdmin();
  const serviceId = String(formData.get("serviceId"));
  const note = String(formData.get("note") ?? "").trim();
  await db.gigService.update({
    where: { id: serviceId },
    data: { status: "REJECTED", rejectionNote: note || "Does not meet listing guidelines." },
  });
  revalidatePath("/admin/services");
}

export async function approveQuickSignupAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const qs = await db.quickSignup.findUnique({ where: { id } });
  if (!qs || qs.status !== "PENDING_APPROVAL") return;

  // A quick-signup account has no password of its own — it's created with a
  // random one nobody knows, and the approval email carries a "set your
  // password" link reusing the exact same reset-token mechanism as
  // "forgot password", rather than inventing a second auth path.
  const randomPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(randomPassword);
  const resetToken = crypto.randomBytes(32).toString("hex");

  const user = await db.user.create({
    data: {
      name: qs.name,
      email: qs.email,
      phone: qs.phone,
      passwordHash,
      role: qs.role,
      status: "APPROVED",
      serviceArea: qs.district,
      businessName: qs.businessName ?? undefined,
      qualification: qs.qualification ?? undefined,
      subjectSpecialization: qs.subjectSpecialization ?? undefined,
      experienceYears: qs.experienceYears ?? undefined,
      resetTokenHash: hashResetToken(resetToken),
      resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  if (qs.role === Role.WORKER && qs.gigCategory && qs.offeringTitle && qs.offeringDescription) {
    await db.gigService.create({
      data: {
        workerId: user.id,
        category: qs.gigCategory,
        title: qs.offeringTitle,
        description: qs.offeringDescription,
        priceType: qs.offeringPrice ? "FIXED" : "QUOTE",
        price: qs.offeringPrice ?? undefined,
        serviceArea: qs.district,
        status: "APPROVED",
      },
    });
  }

  if (
    qs.role === Role.SUPPLIER &&
    qs.productCategory &&
    qs.offeringTitle &&
    qs.offeringDescription &&
    qs.offeringPrice &&
    qs.offeringStock
  ) {
    await db.product.create({
      data: {
        supplierId: user.id,
        category: qs.productCategory,
        title: qs.offeringTitle,
        description: qs.offeringDescription,
        price: qs.offeringPrice,
        unit: qs.offeringUnit ?? "piece",
        stock: qs.offeringStock,
        status: "APPROVED",
      },
    });
  }

  await db.quickSignup.update({ where: { id }, data: { status: "APPROVED" } });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tnschoolcart.com";
  const setPasswordUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  await sendQuickSignupApprovedEmail(qs.email, qs.name, roleLabel(qs.role), setPasswordUrl);

  revalidatePath("/admin/quick-signups");
}

export async function rejectQuickSignupAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  await db.quickSignup.update({
    where: { id },
    data: { status: "REJECTED", rejectionNote: note || null },
  });
  revalidatePath("/admin/quick-signups");
}
