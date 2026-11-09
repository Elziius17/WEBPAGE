import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Wrench } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, ServiceStatusBadge, DeliveryStatusBadge } from "@/components/ui/status-badge";
import { SignOutButton } from "@/components/forms/auth-forms";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import { deviceTypeLabel } from "@/config/statuses";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/mi-cuenta");
  if (isStaff(user.role)) redirect("/admin");
  // Un cliente SOLO ve registros vinculados a su propia ficha.
  const customer = await db.customer.findUnique({
    where: { userId: user.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { delivery: { select: { status: true, trackingNumber: true, courier: { select: { name: true } } } }, _count: { select: { items: true } } } },
      serviceOrders: { orderBy: { receivedAt: "desc" }, select: { id: true, code: true, status: true, receivedAt: true, deviceType: true, brand: true, model: true } },
      serviceRequests: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, kind: true, status: true, createdAt: true, service: { select: { name: true } } } },
    },
  });

  return (
    <>
      <PageHero title={`Hola, ${user.name.split(" ")[0]}`} description={user.email} breadcrumbs={[{ label: "Mi cuenta" }]}>
        <SignOutButton />
      </PageHero>
      <Container className="space-y-10 py-10">
        <section>
          <h2 className="mb-4 text-xl font-bold text-fg">Mis pedidos</h2>
          {customer?.orders.length ? (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-fg-subtle"><tr className="border-b border-white/8"><th className="p-4">Código</th><th className="p-4">Fecha</th><th className="p-4">Productos</th><th className="p-4">Total</th><th className="p-4">Pedido</th><th className="p-4">Entrega</th></tr></thead>
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 last:border-0">
                      <td className="p-4 font-mono font-semibold text-fg">{o.code}</td>
                      <td className="p-4 text-fg-muted">{formatDate(o.createdAt)}</td>
                      <td className="p-4 text-fg-muted">{o._count.items}</td>
                      <td className="p-4 text-fg">{formatPEN(o.totalCents)}</td>
                      <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                      <td className="p-4">
                        {o.delivery && <DeliveryStatusBadge status={o.delivery.status} />}
                        {o.delivery?.trackingNumber && <p className="mt-1 text-xs text-fg-subtle">{o.delivery.courier?.name} · Guía {o.delivery.trackingNumber}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Package} title="Aún no tienes pedidos" action={<ButtonLink href="/tienda" size="sm">Ir a la tienda</ButtonLink>} />
          )}
        </section>
        <section>
          <h2 className="mb-4 text-xl font-bold text-fg">Mis equipos en servicio técnico</h2>
          {customer?.serviceOrders.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {customer.serviceOrders.map((s) => (
                <li key={s.id} className="surface flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-mono font-semibold text-fg">{s.code}</p>
                    <p className="text-sm text-fg-muted">{deviceTypeLabel[s.deviceType]} · {s.brand} {s.model}</p>
                    <p className="text-xs text-fg-subtle">Recibido el {formatDate(s.receivedAt)}</p>
                  </div>
                  <div className="text-right">
                    <ServiceStatusBadge status={s.status} />
                    <Link href={`/seguimiento?codigo=${s.code}`} className="mt-2 block text-xs text-brand-cyan hover:underline">Ver seguimiento</Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Wrench} title="No tienes equipos registrados" description="Las órdenes de servicio que ELZIIUS asocie a tu cuenta aparecerán aquí. También puedes consultar cualquier orden con su código." action={<ButtonLink href="/seguimiento" size="sm" variant="secondary">Consultar por código</ButtonLink>} />
          )}
        </section>
      </Container>
    </>
  );
}
