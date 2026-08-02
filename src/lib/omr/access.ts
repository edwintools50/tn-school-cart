import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";

// The OMNI OMR Suite marketplace listing — there is only ever one, so it's
// simplest to hardcode its id here rather than build product-discovery
// infra nobody else needs. Created once via a one-off script; see the OMR
// Phase 6 notes for how to recreate it if this product is ever deleted.
export const OMR_SUITE_PRODUCT_ID = "cmsbv6l350000fwrvlz6lnjhm";

/**
 * Paid-order-based access: does this user have any OrderItem for the OMNI
 * OMR Suite product on an order that's actually been paid for? This sits
 * ALONGSIDE the original desktop app's offline machine-ID licensing (kept
 * as-is for existing customers, never touched by this) — it's the access
 * model for the hosted/Android channel only. Admins always pass, matching
 * how admin bypass works elsewhere in the app (e.g. moderation queues).
 */
export async function hasOmrAccess(userId: string, role: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  const paidItem = await db.orderItem.findFirst({
    where: { productId: OMR_SUITE_PRODUCT_ID, order: { buyerId: userId, paid: true } },
  });
  return Boolean(paidItem);
}

/** Require a logged-in, approved user who also has paid OMR Suite access — redirects to the /omr paywall/hub otherwise. */
export async function requireOmrAccess() {
  const user = await requireApprovedUser();
  const ok = await hasOmrAccess(user.id, user.role);
  if (!ok) redirect("/omr");
  return user;
}
