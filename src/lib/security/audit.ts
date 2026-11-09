import "server-only";
import { db, type Tx } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getClientIp, getUserAgent } from "./request";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

function toJson(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined || v === null) return undefined;
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

/** Registra un evento de auditoría. Acepta un cliente transaccional opcional. */
export async function audit(input: AuditInput, tx?: Tx) {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    ip = await getClientIp();
    userAgent = await getUserAgent();
  } catch {
    // fuera de un contexto de petición (seed, scripts)
  }
  await (tx ?? db).auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: toJson(input.before),
      after: toJson(input.after),
      ip,
      userAgent: userAgent?.slice(0, 300) ?? null,
    },
  });
}
