import "server-only";
import { Resend } from "resend";

// Recruitment/onboarding emails (quick-signup OTP + "you're listed" notices)
// use a distinct, human-sounding sender from the transactional EMAIL_FROM —
// requested explicitly so these read as a welcome/onboarding touchpoint, not
// a generic no-reply notice. Same verified domain as EMAIL_FROM, since a
// raw @gmail.com "from" address can't pass SPF/DKIM through Resend and would
// land in spam or get rejected outright.
const ONBOARDING_EMAIL_FROM =
  process.env.ONBOARDING_EMAIL_FROM ?? "TN School Cart Onboarding <onboarding@tnschoolcart.com>";

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
  items: { title: string; productId: string }[]
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tnschoolcart.com";

  // Link to our own purchase-gated download route, not the underlying Blob
  // URL directly — the file location itself is only ever revealed to a
  // signed-in buyer with a paid order for this exact product.
  const linksHtml = items
    .map((item) => `<li><a href="${baseUrl}/api/downloads/${item.productId}">${item.title}</a></li>`)
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

export async function sendQuickSignupOtpEmail(to: string, name: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Sign-up email is not configured. Contact support.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: ONBOARDING_EMAIL_FROM,
    to,
    subject: `Your verification code: ${code}`,
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up with TN School Cart. Enter this code to verify your email address:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/** Sent once an admin approves a quick-signup and the person's listing goes live. */
export async function sendQuickSignupApprovedEmail(
  to: string,
  name: string,
  roleLabel: string,
  setPasswordUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] Skipping quick-signup approval email — RESEND_API_KEY not configured.");
    return;
  }

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: ONBOARDING_EMAIL_FROM,
      to,
      subject: "You're listed on TN School Cart!",
      html: `
        <p>Hi ${name},</p>
        <p>Good news — your ${roleLabel} listing is now live on TN School Cart.</p>
        <p><a href="${setPasswordUrl}">Set a password for your account</a> to log in anytime and manage
        your listing, add more products or services, and track activity. This link expires in 1 hour —
        if it does, use "Forgot password" on the login page with this same email address.</p>
      `,
    });
    if (error) {
      console.error("[email] Quick-signup approval email failed:", error.message);
    }
  } catch (e) {
    console.error("[email] Quick-signup approval email failed:", e);
  }
}
