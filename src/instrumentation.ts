import * as Sentry from "@sentry/nextjs";

// Same "leave unset to disable" pattern as WhatsApp/Razorpay: no DSN means
// Sentry.init() never runs, so captureRequestError below stays a safe no-op.
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
