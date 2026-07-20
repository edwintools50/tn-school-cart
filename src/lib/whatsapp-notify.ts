import "server-only";

const GRAPH_API_VERSION = "v21.0";

/**
 * Meta requires phone numbers in international format (country code + number,
 * digits only, no leading +). We store phone as free text at signup, so
 * normalize it here — assume India (91) when a 10-digit local number is given.
 */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length > 10) return digits;
  return null;
}

type TemplateName =
  | "order_placed"
  | "order_status_update"
  | "new_order_alert_v2"
  | "gig_offer_received"
  | "gig_assigned"
  | "gig_status_update";

/**
 * Sends a pre-approved WhatsApp template message via Meta's Cloud API.
 * Silently no-ops (with a console warning) when credentials aren't configured,
 * and never throws — a notification failure must never break the order/gig
 * flow that triggered it.
 */
async function sendTemplate(
  toRaw: string,
  template: TemplateName,
  params: string[]
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn(
      `[whatsapp] Skipping "${template}" notification — WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured.`
    );
    return;
  }

  const to = normalizePhone(toRaw);
  if (!to) {
    console.warn(`[whatsapp] Skipping "${template}" — could not normalize phone "${toRaw}".`);
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[whatsapp] "${template}" to ${to} failed (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error(`[whatsapp] "${template}" to ${to} threw:`, err);
  }
}

export async function notifyOrderPlaced(params: {
  phone: string;
  buyerName: string;
  orderShortId: string;
  totalAmount: number;
}) {
  await sendTemplate(params.phone, "order_placed", [
    params.buyerName,
    params.orderShortId,
    params.totalAmount.toFixed(2),
  ]);
}

export async function notifyOrderStatusUpdate(params: {
  phone: string;
  buyerName: string;
  orderShortId: string;
  itemTitle: string;
  status: string;
}) {
  await sendTemplate(params.phone, "order_status_update", [
    params.buyerName,
    params.orderShortId,
    params.itemTitle,
    params.status,
  ]);
}

export async function notifyNewOrder(params: {
  phone: string;
  supplierName: string;
  quantity: number;
  itemTitle: string;
  schoolName: string;
  orderShortId: string;
}) {
  await sendTemplate(params.phone, "new_order_alert_v2", [
    params.supplierName,
    String(params.quantity),
    params.itemTitle,
    params.schoolName,
    params.orderShortId,
  ]);
}

export async function notifyGigOfferReceived(params: {
  phone: string;
  principalName: string;
  workerName: string;
  quotedPrice: number;
  jobTitle: string;
}) {
  await sendTemplate(params.phone, "gig_offer_received", [
    params.principalName,
    params.workerName,
    params.quotedPrice.toFixed(2),
    params.jobTitle,
  ]);
}

export async function notifyGigAssigned(params: {
  phone: string;
  workerName: string;
  jobTitle: string;
  schoolName: string;
}) {
  await sendTemplate(params.phone, "gig_assigned", [
    params.workerName,
    params.jobTitle,
    params.schoolName,
  ]);
}

export async function notifyGigStatusUpdate(params: {
  phone: string;
  recipientName: string;
  jobTitle: string;
  schoolName: string;
  status: string;
}) {
  await sendTemplate(params.phone, "gig_status_update", [
    params.recipientName,
    params.jobTitle,
    params.schoolName,
    params.status,
  ]);
}
