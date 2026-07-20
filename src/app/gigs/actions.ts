"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GigCategory, GigRequestStatus } from "@/generated/prisma/enums";
import { notifyGigAssigned, notifyGigOfferReceived, notifyGigStatusUpdate } from "@/lib/whatsapp-notify";

export type ActionState = { error?: string } | undefined;

const gigRequestSchema = z.object({
  category: z.enum(GigCategory),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(10, "Please describe the work needed"),
  schoolName: z.string().trim().min(2, "School name is required"),
  udiseNumber: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "UDISE number must be the 11-digit school code"),
  district: z.string().trim().min(2, "District is required"),
  taluk: z.string().trim().min(2, "Taluk is required"),
  block: z.string().trim().min(2, "Block is required"),
  pinCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pin code"),
  address: z.string().trim().min(5, "Address is required"),
  preferredDate: z.string().trim().optional(),
  budget: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().nonnegative().optional()
  ),
});

export async function createGigRequestAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["PRINCIPAL"]);
  const raw = Object.fromEntries(formData.entries());
  const parsed = gigRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const gigRequest = await db.gigRequest.create({
    data: {
      principalId: user.id,
      category: data.category,
      title: data.title,
      description: data.description,
      schoolName: data.schoolName,
      udiseNumber: data.udiseNumber,
      district: data.district,
      taluk: data.taluk,
      block: data.block,
      pinCode: data.pinCode,
      address: data.address,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
      budget: data.budget ?? null,
    },
  });

  revalidatePath("/gigs");
  redirect(`/gigs/${gigRequest.id}`);
}

const offerSchema = z.object({
  gigRequestId: z.string().min(1),
  quotedPrice: z.coerce.number().positive("Enter a valid quote"),
  message: z.string().trim().min(5, "Add a short message"),
});

export async function submitOfferAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["WORKER"]);
  const parsed = offerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { gigRequestId, quotedPrice, message } = parsed.data;

  const gigRequest = await db.gigRequest.findUnique({
    where: { id: gigRequestId },
    include: { principal: true },
  });
  if (!gigRequest || gigRequest.status !== "OPEN") {
    return { error: "This gig request is no longer open for offers." };
  }

  await db.gigOffer.upsert({
    where: { gigRequestId_workerId: { gigRequestId, workerId: user.id } },
    create: { gigRequestId, workerId: user.id, quotedPrice, message },
    update: { quotedPrice, message, status: "PENDING" },
  });

  await notifyGigOfferReceived({
    phone: gigRequest.principal.phone,
    principalName: gigRequest.principal.name,
    workerName: user.businessName ?? user.name,
    quotedPrice,
    jobTitle: gigRequest.title,
  });

  revalidatePath(`/gigs/${gigRequestId}`);
  return undefined;
}

export async function acceptOfferAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);
  const offerId = String(formData.get("offerId"));

  const offer = await db.gigOffer.findUnique({
    include: { gigRequest: true, worker: true },
    where: { id: offerId },
  });
  if (!offer || offer.gigRequest.principalId !== user.id) throw new Error("Not found");
  if (offer.gigRequest.status !== "OPEN") throw new Error("Request already assigned");

  await db.$transaction([
    db.gigOffer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } }),
    db.gigOffer.updateMany({
      where: { gigRequestId: offer.gigRequestId, id: { not: offerId } },
      data: { status: "REJECTED" },
    }),
    db.gigRequest.update({ where: { id: offer.gigRequestId }, data: { status: "ASSIGNED" } }),
  ]);

  await notifyGigAssigned({
    phone: offer.worker.phone,
    workerName: offer.worker.businessName ?? offer.worker.name,
    jobTitle: offer.gigRequest.title,
    schoolName: offer.gigRequest.schoolName,
  });

  revalidatePath(`/gigs/${offer.gigRequestId}`);
}

const requestStatusTransitions: Record<string, string[]> = {
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  OPEN: ["CANCELLED"],
};

export async function updateGigRequestStatusAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);
  const gigRequestId = String(formData.get("gigRequestId"));
  const status = String(formData.get("status"));

  const gigRequest = await db.gigRequest.findUnique({
    where: { id: gigRequestId },
    include: { offers: { where: { status: "ACCEPTED" }, include: { worker: true } } },
  });
  if (!gigRequest || gigRequest.principalId !== user.id) throw new Error("Not found");

  const allowed = requestStatusTransitions[gigRequest.status] ?? [];
  if (!allowed.includes(status)) throw new Error("Invalid status transition");

  await db.gigRequest.update({
    where: { id: gigRequestId },
    data: { status: status as GigRequestStatus },
  });

  const assignedWorker = gigRequest.offers[0]?.worker;
  if (assignedWorker) {
    await notifyGigStatusUpdate({
      phone: assignedWorker.phone,
      recipientName: assignedWorker.businessName ?? assignedWorker.name,
      jobTitle: gigRequest.title,
      schoolName: gigRequest.schoolName,
      status,
    });
  }

  revalidatePath(`/gigs/${gigRequestId}`);
  revalidatePath("/gigs/mine");
}
