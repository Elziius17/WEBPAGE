import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** IP del cliente según cabeceras del proxy (x-forwarded-for / x-real-ip). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getUserAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}

/** Hash no reversible de la IP para registros (minimización de datos personales). */
export function hashIp(ip: string): string {
  const salt = process.env.BETTER_AUTH_SECRET ?? "elziius";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
