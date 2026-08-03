import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/enums";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;

  // The session row (not just JWT validity) is the source of truth for
  // whether this specific login is still allowed — logging out, "log out
  // other devices", or the soft concurrent-device cap all work by deleting
  // it, which must take effect immediately rather than waiting out the
  // JWT's 30-day expiry.
  const dbSession = await db.session.findUnique({
    where: { id: session.sessionId },
    include: { user: true },
  });
  if (!dbSession) return null;

  const user = dbSession.user;
  // A suspension must take effect immediately, not just block future logins —
  // otherwise a suspended user with an existing session keeps full access
  // until their 30-day session cookie naturally expires.
  if (user.status === "SUSPENDED") return null;
  return user;
}

/**
 * Require a logged-in user, optionally restricted to given roles.
 * Redirects to /login (not authed) or / (wrong role) when the check fails.
 */
export async function requireUser(allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect("/");
  return user;
}

/** Require a logged-in, APPROVED user of the given roles. */
export async function requireApprovedUser(allowedRoles?: Role[]) {
  const user = await requireUser(allowedRoles);
  if (user.status !== "APPROVED") redirect("/account/pending");
  return user;
}

export async function requireAdmin() {
  return requireUser(["ADMIN"]);
}
