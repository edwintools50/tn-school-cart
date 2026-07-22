import "server-only";
import { Resend } from "resend";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Password reset email is not configured. Contact support.");
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "TN School Cart <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your TN School Cart password",
    html: `
      <p>We received a request to reset your TN School Cart password.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
}

/**
 * Emails the buyer their digital-product download links after payment is
 * confirmed. Never throws — a delivery-email failure must not break the
 * payment/order flow that triggered it; the buyer can still get the file
 * from their order page.
 */
export async function sendDigitalDeliveryEmail(
  to: string,
  buyerName: string,
  orderShortId: string,
  items: { title: string; fileUrl: string }[]
): Promise<void> {
  if (items.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] Skipping digital delivery email for order #${orderShortId} — RESEND_API_KEY not configured.`
    );
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "TN School Cart <onboarding@resend.dev>";

  const linksHtml = items
    .map((item) => `<li><a href="${item.fileUrl}">${item.title}</a></li>`)
    .join("");

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Your digital downloads for order #${orderShortId}`,
      html: `
        <p>Hi ${buyerName},</p>
        <p>Thanks for your order! Your digital item(s) are ready to download:</p>
        <ul>${linksHtml}</ul>
        <p>You can also find these links anytime on your order page.</p>
      `,
    });
    if (error) {
      console.error(`[email] Digital delivery email failed for order #${orderShortId}:`, error.message);
    }
  } catch (e) {
    console.error(`[email] Digital delivery email failed for order #${orderShortId}:`, e);
  }
}
