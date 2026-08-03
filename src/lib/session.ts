import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "tnsc_session";
const alg = "HS256";

// A soft cap, not a hard block: logging in beyond this just quietly signs
// out the oldest device rather than refusing the new login or showing an
// error. Chosen to comfortably cover one person's phone + laptop + the odd
// second device, while making silent account-sharing across many devices
// eventually self-limiting.
export const MAX_CONCURRENT_SESSIONS = 3;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  sessionId: string;
};

/**
 * Creates a DB-backed session row for this login (so it can be individually
 * revoked later — see destroySession / "log out other devices" — without
 * waiting out the JWT's 30-day expiry), then signs a JWT carrying its id.
 * If the user already has MAX_CONCURRENT_SESSIONS active, the oldest ones
 * are evicted first.
 */
export async function createSession(userId: string) {
  const existing = await db.session.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing.length >= MAX_CONCURRENT_SESSIONS) {
    const overflow = existing.length - MAX_CONCURRENT_SESSIONS + 1;
    await db.session.deleteMany({ where: { id: { in: existing.slice(0, overflow).map((s) => s.id) } } });
  }

  const hdrs = await headers();
  const session = await db.session.create({
    data: { userId, userAgent: hdrs.get("user-agent")?.slice(0, 255) },
  });

  const token = await new SignJWT({ userId, sessionId: session.id })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clears the cookie and deletes this login's session row (explicit logout revokes server-side, not just client-side). */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);
  if (!token) return;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sessionId === "string") {
      await db.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    }
  } catch {
    // Token already invalid/expired — nothing to clean up.
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "string" || typeof payload.sessionId !== "string") return null;
    return { userId: payload.userId, sessionId: payload.sessionId };
  } catch {
    return null;
  }
}
