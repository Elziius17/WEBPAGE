import "server-only";
import { db } from "@/lib/db";
import { getClientIp, hashIp } from "./request";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Limitador de ventana fija persistido en PostgreSQL (seguro con varias instancias).
 * Usa una única sentencia atómica (INSERT ... ON CONFLICT) por petición.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const key = `app:${bucket}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const rows = await db.$queryRaw<{ count: number; lastRequest: bigint }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${key}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."lastRequest" < ${windowStart} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN "RateLimit"."lastRequest" < ${windowStart} THEN ${now} ELSE "RateLimit"."lastRequest" END
    RETURNING "count", "lastRequest"`;
  const row = rows[0];
  if (!row) return { ok: true };
  if (row.count > limit) {
    const resetAt = Number(row.lastRequest) + windowSeconds * 1000;
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/** Aplica rate limit por IP del cliente actual. */
export async function rateLimitByIp(
  bucket: string,
  opts: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  return rateLimit(bucket, hashIp(ip), opts);
}
