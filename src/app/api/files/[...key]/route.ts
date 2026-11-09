import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { getObject, isValidKey } from "@/lib/storage";

/**
 * Sirve archivos del almacenamiento local:
 *  - Imágenes de productos: públicas.
 *  - Adjuntos de órdenes y entregas: solo personal autorizado.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...key]">) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  if (!isValidKey(key)) return new Response("No encontrado", { status: 404 });

  let mime = "application/octet-stream";
  if (key.startsWith("products/")) {
    const img = await db.productImage.findFirst({
      where: { storageKey: key },
      select: { id: true },
    });
    if (!img) return new Response("No encontrado", { status: 404 });
    mime = key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
  } else {
    const user = await getCurrentUser();
    const att = await db.attachment.findUnique({
      where: { storageKey: key },
      select: { mimeType: true, serviceOrderId: true, deliveryId: true },
    });
    if (!att) return new Response("No encontrado", { status: 404 });
    const perm = att.serviceOrderId ? "service-orders:read" : "deliveries:write";
    if (!user || !hasPermission(user.role, perm))
      return new Response("No autorizado", { status: 403 });
    mime = att.mimeType;
  }
  const body = await getObject(key);
  if (!body) return new Response("No encontrado", { status: 404 });
  return new Response(Buffer.from(body), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": key.startsWith("products/")
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": mime === "application/pdf" ? "attachment" : "inline",
    },
  });
}
