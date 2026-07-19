import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { confirmOrderPayment, verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Server-to-server confirmation from Razorpay, redundant with the client-side
 * verification in verifyRazorpayPaymentAction — this catches the case where a
 * buyer completes payment but closes the browser before the client callback
 * fires. Configure this URL + a webhook secret in the Razorpay dashboard under
 * Settings → Webhooks, subscribed to the "payment.captured" event.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      await confirmOrderPayment(payment.order_id, payment.id);
    }
  }

  return NextResponse.json({ received: true });
}
