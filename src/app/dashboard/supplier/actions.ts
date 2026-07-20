"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCategory, OrderStatus } from "@/generated/prisma/enums";
import { notifyOrderStatusUpdate } from "@/lib/whatsapp-notify";
import { uploadPhoto } from "@/lib/blob";

export type ActionState = { error?: string } | undefined;

const productSchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(10, "Please add a longer description"),
  category: z.enum(ProductCategory),
  price: z.coerce.number().positive("Price must be greater than 0"),
  unit: z.string().trim().min(1).default("piece"),
  stock: z.coerce.number().int().min(0, "Stock can't be negative"),
});

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["SUPPLIER"]);
  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadPhoto(formData.get("imagePhoto") as File | null, "products");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo upload failed." };
  }

  await db.product.create({
    data: {
      ...parsed.data,
      imageUrl: imageUrl ?? null,
      supplierId: user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/supplier");
  redirect("/dashboard/supplier");
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["SUPPLIER"]);
  const productId = String(formData.get("productId"));

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.supplierId !== user.id) {
    return { error: "Product not found." };
  }

  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadPhoto(formData.get("imagePhoto") as File | null, "products");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo upload failed." };
  }

  await db.product.update({
    where: { id: productId },
    data: {
      ...parsed.data,
      ...(imageUrl ? { imageUrl } : {}),
      status: "PENDING",
      rejectionNote: null,
    },
  });

  revalidatePath("/dashboard/supplier");
  redirect("/dashboard/supplier");
}

export async function delistProductAction(formData: FormData) {
  const user = await requireUser(["SUPPLIER"]);
  const productId = String(formData.get("productId"));

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.supplierId !== user.id) throw new Error("Not found");

  await db.product.update({ where: { id: productId }, data: { status: "DELISTED" } });
  revalidatePath("/dashboard/supplier");
}

const orderItemStatuses = [
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
] as const;

export async function updateOrderItemStatusAction(formData: FormData) {
  const user = await requireUser(["SUPPLIER"]);
  const orderItemId = String(formData.get("orderItemId"));
  const status = String(formData.get("status"));

  if (!orderItemStatuses.includes(status as (typeof orderItemStatuses)[number])) {
    throw new Error("Invalid status");
  }

  const item = await db.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { buyer: true } } },
  });
  if (!item || item.supplierId !== user.id) throw new Error("Not found");

  await db.orderItem.update({
    where: { id: orderItemId },
    data: { status: status as OrderStatus },
  });

  await notifyOrderStatusUpdate({
    phone: item.order.buyer.phone,
    buyerName: item.order.buyer.name,
    orderShortId: item.order.id.slice(-8),
    itemTitle: item.titleAtOrder,
    status,
  });

  revalidatePath("/dashboard/supplier/orders");
}
