"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

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
