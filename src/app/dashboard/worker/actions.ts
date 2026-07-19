"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GigCategory } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

const serviceSchema = z.object({
  category: z.enum(GigCategory),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(10, "Please add a longer description"),
  priceType: z.enum(["FIXED", "HOURLY", "QUOTE"]),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().nonnegative().optional()
  ),
  serviceArea: z.string().trim().min(2, "Service area is required"),
});

export async function createServiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["WORKER"]);
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.gigService.create({
    data: {
      ...parsed.data,
      price: parsed.data.priceType === "QUOTE" ? null : (parsed.data.price ?? null),
      workerId: user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/worker");
  redirect("/dashboard/worker");
}

export async function updateServiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["WORKER"]);
  const serviceId = String(formData.get("serviceId"));

  const existing = await db.gigService.findUnique({ where: { id: serviceId } });
  if (!existing || existing.workerId !== user.id) {
    return { error: "Service not found." };
  }

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.gigService.update({
    where: { id: serviceId },
    data: {
      ...parsed.data,
      price: parsed.data.priceType === "QUOTE" ? null : (parsed.data.price ?? null),
      status: "PENDING",
      rejectionNote: null,
    },
  });

  revalidatePath("/dashboard/worker");
  redirect("/dashboard/worker");
}

export async function delistServiceAction(formData: FormData) {
  const user = await requireUser(["WORKER"]);
  const serviceId = String(formData.get("serviceId"));

  const existing = await db.gigService.findUnique({ where: { id: serviceId } });
  if (!existing || existing.workerId !== user.id) throw new Error("Not found");

  await db.gigService.update({ where: { id: serviceId }, data: { status: "DELISTED" } });
  revalidatePath("/dashboard/worker");
}
