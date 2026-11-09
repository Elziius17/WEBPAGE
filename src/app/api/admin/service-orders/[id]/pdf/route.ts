import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { serviceOrderScope } from "@/services/service-orders";
import { renderServiceOrderPdf } from "@/lib/pdf/service-order-pdf";
import { getBusinessSettings } from "@/services/settings";
import { audit } from "@/lib/security/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/service-orders/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "service-orders:read")) return new Response("No autorizado", { status: 403 });
  const { id } = await ctx.params;
  const order = await db.serviceOrder.findFirst({
    where: { id, ...(await serviceOrderScope(user)) },
    include: {
      customer: true,
      service: { select: { name: true } },
      technician: { select: { user: { select: { name: true } } } },
      diagnoses: { orderBy: { createdAt: "desc" }, take: 1 },
      approvals: { orderBy: { createdAt: "asc" } },
      repairTasks: { orderBy: { performedAt: "asc" } },
      parts: true,
      quality: { orderBy: { performedAt: "desc" }, take: 1, include: { items: true } },
    },
  });
  if (!order) return new Response("No encontrado", { status: 404 });
  const pdf = await renderServiceOrderPdf(order, await getBusinessSettings());
  await audit({ userId: user.id, action: "service-order.pdf", entity: "ServiceOrder", entityId: order.id });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-${order.code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
