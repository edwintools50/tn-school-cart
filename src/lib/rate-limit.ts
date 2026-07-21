import "server-only";
import { db } from "@/lib/db";

export async function checkRateLimit(
  identifier: string,
  action: string,
  opts: { max: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - opts.windowMs);

  await db.rateLimitAttempt.deleteMany({
    where: { action, createdAt: { lt: windowStart } },
  });

  const count = await db.rateLimitAttempt.count({
    where: { identifier, action, createdAt: { gte: windowStart } },
  });

  if (count >= opts.max) {
    const oldest = await db.rateLimitAttempt.findFirst({
      where: { identifier, action, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
    });
    const retryAfterSeconds = oldest
      ? Math.ceil((oldest.createdAt.getTime() + opts.windowMs - Date.now()) / 1000)
      : Math.ceil(opts.windowMs / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  await db.rateLimitAttempt.create({ data: { identifier, action } });
  return { allowed: true };
}
