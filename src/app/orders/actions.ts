"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmOrderPayment, verifyCheckoutSignature } from "@/lib/razorpay";

export type PaymentVerifyResult = { ok: boolean; error?: string };

export async function verifyRazorpayPaymentAction(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PaymentVerifyResult> {
  const user = await requireUser(["PRINCIPAL"]);

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.buyerId !== user.id) {
    return { ok: false, error: "Order not found." };
  }
  if (order.razorpayOrderId !== params.razorpayOrderId) {
    return { ok: false, error: "Payment does not match this order." };
  }

  const validSignature = verifyCheckoutSignature({
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpaySignature: params.razorpaySignature,
  });
  if (!validSignature) {
    return { ok: false, error: "Payment could not be verified. Please contact support." };
  }

  const result = await confirmOrderPayment(params.razorpayOrderId, params.razorpayPaymentId);
  if (!result.ok) {
    return { ok: false, error: result.reason };
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { ok: true };
}
