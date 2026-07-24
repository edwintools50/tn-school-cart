import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { notifyNewOrder, notifyOrderPlaced } from "@/lib/whatsapp-notify";
import { sendDigitalDeliveryEmail } from "@/lib/email";

export function isRazorpayConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

let client: Razorpay | null = null;
function getClient() {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

/** Creates a Razorpay Order for the given amount (rupees) and returns its ID. */
export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const order = await getClient().orders.create({
    amount: Math.round(amountRupees * 100), // paise
    currency: "INR",
    receipt,
  });
  return order.id;
}

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Verifies the signature Razorpay's Checkout modal hands back to the client on success. */
export function verifyCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return verifySignature(
    `${params.razorpayOrderId}|${params.razorpayPaymentId}`,
    params.razorpaySignature,
    process.env.RAZORPAY_KEY_SECRET!
  );
}

/** Verifies the X-Razorpay-Signature header on incoming webhook requests. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return verifySignature(rawBody, signature, secret);
}

/**
 * Marks an order paid and fires the "order placed" / "new order" notifications.
 * Idempotent: the WHERE clause only matches unpaid orders, so calling this
 * twice for the same order (once from the client callback, once from the
 * webhook) only sends notifications and updates stock/status the first time.
 */
export async function confirmOrderPayment(razorpayOrderId: string, razorpayPaymentId: string) {
  const order = await db.order.findUnique({ where: { razorpayOrderId } });
  if (!order) return { ok: false as const, reason: "Order not found for this payment." };
  if (order.paid) return { ok: true as const, alreadyConfirmed: true };

  const updated = await db.order.updateMany({
    where: { id: order.id, paid: false },
    data: { paid: true, razorpayPaymentId },
  });
  if (updated.count === 0) {
    // Another request (webhook vs. client callback) already confirmed it.
    return { ok: true as const, alreadyConfirmed: true };
  }

  const [buyer, items] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: order.buyerId } }),
    db.orderItem.findMany({
      where: { orderId: order.id },
      include: { supplier: true, product: true },
    }),
  ]);

  const orderShortId = order.id.slice(-8);

  await notifyOrderPlaced({
    phone: buyer.phone,
    buyerName: buyer.name,
    orderShortId,
    totalAmount: order.totalAmount,
  });

  for (const item of items) {
    await notifyNewOrder({
      phone: item.supplier.phone,
      supplierName: item.supplier.businessName ?? item.supplier.name,
      quantity: item.quantity,
      itemTitle: item.titleAtOrder,
      schoolName: order.shippingSchool,
      orderShortId,
    });
  }

  const digitalItems = items
    .filter((item) => item.product.isDigital && item.product.fileUrl)
    .map((item) => ({ title: item.titleAtOrder, productId: item.productId }));
  await sendDigitalDeliveryEmail(buyer.email, buyer.name, orderShortId, digitalItems);

  return { ok: true as const, alreadyConfirmed: false };
}
