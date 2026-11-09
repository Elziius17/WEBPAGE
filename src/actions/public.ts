"use server";

import {
  complaintSchema,
  publicRequestSchema,
  trackingLookupSchema,
} from "@/lib/validations/public";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/checkout";
import { handleActionError, validationError, type ActionResult } from "@/lib/actions";
import { rateLimitByIp } from "@/lib/security/rate-limit";
import { createPublicRequest } from "@/services/requests";
import { findPublicTracking, type PublicTracking } from "@/services/service-orders";
import { createOrder } from "@/services/orders";
import { getCartProducts, availableUnits } from "@/services/catalog";
import { getCurrentUser } from "@/lib/auth/session";

export async function submitPublicRequest(input: unknown): Promise<ActionResult> {
  try {
    const parsed = publicRequestSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    // Honeypot: los bots completan el campo oculto "website".
    if (parsed.data.website) return { ok: true, message: "Solicitud recibida." };
    const rl = await rateLimitByIp("public-request", { limit: 5, windowSeconds: 600 });
    if (!rl.ok)
      return {
        ok: false,
        error: `Demasiadas solicitudes. Intenta en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
      };
    await createPublicRequest(parsed.data);
    return { ok: true, message: "¡Gracias! Recibimos tu solicitud y te contactaremos pronto." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function lookupTracking(input: unknown): Promise<ActionResult<PublicTracking>> {
  try {
    const parsed = trackingLookupSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    // Límite estricto contra enumeración de códigos.
    const rl = await rateLimitByIp("tracking", { limit: 10, windowSeconds: 600 });
    if (!rl.ok)
      return {
        ok: false,
        error: `Demasiados intentos. Intenta nuevamente en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
      };
    const result = await findPublicTracking(parsed.data.code, parsed.data.verifier);
    // Mensaje genérico: no revela si el código existe.
    if (!result)
      return {
        ok: false,
        error:
          "No encontramos una orden con esos datos. Verifica el código y el correo o teléfono registrado.",
      };
    return { ok: true, data: result };
  } catch (e) {
    return handleActionError(e);
  }
}

export type CartSnapshotItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  available: number;
  image: string | null;
  isDemo: boolean;
};

/** Devuelve precio y disponibilidad actuales desde la BD para los IDs del carrito. */
export async function getCartSnapshot(ids: unknown): Promise<CartSnapshotItem[]> {
  if (!Array.isArray(ids)) return [];
  const clean = ids.filter((i): i is string => typeof i === "string" && i.length < 40).slice(0, 30);
  const products = await getCartProducts(clean);
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    priceCents: p.priceCents,
    available: availableUnits(p),
    image: p.images[0]?.url ?? null,
    isDemo: p.isDemo,
  }));
}

export async function placeOrder(
  input: unknown,
): Promise<ActionResult<{ code: string; totalCents: number }>> {
  try {
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const rl = await rateLimitByIp("checkout", { limit: 6, windowSeconds: 900 });
    if (!rl.ok)
      return {
        ok: false,
        error:
          "Has registrado varios pedidos seguidos. Intenta en unos minutos o escríbenos por WhatsApp.",
      };
    const user = await getCurrentUser();
    const order = await createOrder(parsed.data, user?.id ?? null);
    return { ok: true, data: { code: order.code, totalCents: order.totalCents } };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function submitComplaint(
  input: unknown,
): Promise<ActionResult<{ code: string; createdAt: string }>> {
  try {
    const parsed = complaintSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    if (parsed.data.website) return { ok: false, error: "Solicitud inválida." };
    const rl = await rateLimitByIp("complaint", { limit: 3, windowSeconds: 3600 });
    if (!rl.ok)
      return { ok: false, error: "Has enviado varias hojas de reclamación. Intenta más tarde." };
    const d = parsed.data;
    const lines = [
      `Tipo: ${d.type}`,
      `Documento: ${d.documentType} ${d.documentNumber}`,
      `Domicilio: ${d.address}`,
      d.guardian ? `Padre/madre o apoderado: ${d.guardian}` : null,
      `Bien contratado: ${d.goodType} — ${d.goodDescription}`,
      d.amount ? `Monto reclamado: S/ ${d.amount}` : null,
      "",
      `Detalle: ${d.detail}`,
      "",
      `Pedido del consumidor: ${d.request}`,
    ].filter((l) => l !== null);
    const r = await db.serviceRequest.create({
      data: {
        kind: "COMPLAINT",
        name: d.name,
        email: d.email,
        phone: d.phone,
        subject: `${d.type === "RECLAMO" ? "Reclamo" : "Queja"} — ${d.goodType.toLowerCase()}`,
        message: lines.join("\n"),
        consentAt: new Date(),
      },
    });
    const code = `LR-${new Date().getFullYear()}-${r.id.slice(-8).toUpperCase()}`;
    await db.serviceRequest.update({
      where: { id: r.id },
      data: {
        subject: `${code} · ${d.type === "RECLAMO" ? "Reclamo" : "Queja"} — ${d.goodType.toLowerCase()}`,
      },
    });
    return { ok: true, data: { code, createdAt: r.createdAt.toISOString() } };
  } catch (e) {
    return handleActionError(e);
  }
}
