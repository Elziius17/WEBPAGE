import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Wrench } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import {
  OrderStatusBadge,
  ServiceStatusBadge,
  DeliveryStatusBadge,
} from "@/components/ui/status-badge";
import { SignOutButton } from "@/components/forms/auth-forms";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import { deviceTypeLabel } from "@/config/statuses";
import { getOwnTestimonial } from "@/services/testimonials";
import { TestimonialForm } from "@/components/forms/testimonial-form";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/mi-cuenta");
  if (isStaff(user.role)) redirect("/admin");
  // Un cliente SOLO ve registros vinculados a su propia ficha.
  const testimonialPromise = getOwnTestimonial(user.id);
  const customer = await db.customer.findUnique({
    where: { userId: user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          delivery: {
            select: { status: true, trackingNumber: true, courier: { select: { name: true } } },
          },
          _count: { select: { items: true } },
        },
      },
      serviceOrders: {
        orderBy: { receivedAt: "desc" },
        select: {
          id: true,
          code: true,
          status: true,
          receivedAt: true,
          deviceType: true,
          brand: true,
          model: true,
        },
      },
      serviceRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          kind: true,
          status: true,
          createdAt: true,
          service: { select: { name: true } },
        },
      },
    },
  });

  const testimonial = await testimonialPromise;
  const parts = user.name.trim().split(/\s+/);
  const suggestedName =
    parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.`
      : parts[0]!;

  return (
    <>
      <PageHero
        title={`Hola, ${user.name.split(" ")[0]}`}
        description={user.email}
        breadcrumbs={[{ label: "Mi cuenta" }]}
      >
        <SignOutButton />
      </PageHero>
      <Container className="space-y-10 py-10">
        <section>
          <h2 className="text-fg mb-4 text-xl font-bold">Mis pedidos</h2>
          {customer?.orders.length ? (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-fg-subtle text-left text-xs">
                  <tr className="border-b border-white/8">
                    <th className="p-4">Código</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Productos</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Pedido</th>
                    <th className="p-4">Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 last:border-0">
                      <td className="text-fg p-4 font-mono font-semibold">{o.code}</td>
                      <td className="text-fg-muted p-4">{formatDate(o.createdAt)}</td>
                      <td className="text-fg-muted p-4">{o._count.items}</td>
                      <td className="text-fg p-4">{formatPEN(o.totalCents)}</td>
                      <td className="p-4">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="p-4">
                        {o.delivery && <DeliveryStatusBadge status={o.delivery.status} />}
                        {o.delivery?.trackingNumber && (
                          <p className="text-fg-subtle mt-1 text-xs">
                            {o.delivery.courier?.name} · Guía {o.delivery.trackingNumber}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Aún no tienes pedidos"
              action={
                <ButtonLink href="/tienda" size="sm">
                  Ir a la tienda
                </ButtonLink>
              }
            />
          )}
        </section>
        <section>
          <h2 className="text-fg mb-4 text-xl font-bold">Mis equipos en servicio técnico</h2>
          {customer?.serviceOrders.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {customer.serviceOrders.map((s) => (
                <li key={s.id} className="surface flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-fg font-mono font-semibold">{s.code}</p>
                    <p className="text-fg-muted text-sm">
                      {deviceTypeLabel[s.deviceType]} · {s.brand} {s.model}
                    </p>
                    <p className="text-fg-subtle text-xs">Recibido el {formatDate(s.receivedAt)}</p>
                  </div>
                  <div className="text-right">
                    <ServiceStatusBadge status={s.status} />
                    <Link
                      href={`/seguimiento?codigo=${s.code}`}
                      className="text-brand-cyan mt-2 block text-xs hover:underline"
                    >
                      Ver seguimiento
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Wrench}
              title="No tienes equipos registrados"
              description="Las órdenes de servicio que ELZIIUS asocie a tu cuenta aparecerán aquí. También puedes consultar cualquier orden con su código."
              action={
                <ButtonLink href="/seguimiento" size="sm" variant="secondary">
                  Consultar por código
                </ButtonLink>
              }
            />
          )}
        </section>
        <section id="testimonio" className="scroll-mt-24">
          <h2 className="text-fg mb-1 text-xl font-bold">Tu opinión sobre ELZIIUS</h2>
          <p className="text-fg-muted mb-4 text-sm">
            Ayuda a otros clientes contando tu experiencia. Se mostrará en la página de inicio una
            vez revisada.
          </p>
          <div className="max-w-2xl">
            <TestimonialForm
              existing={
                testimonial && {
                  authorName: testimonial.authorName,
                  authorRole: testimonial.authorRole,
                  content: testimonial.content,
                  rating: testimonial.rating,
                  approved: testimonial.approved,
                  verified: testimonial.verified,
                }
              }
              suggestedName={suggestedName}
            />
          </div>
        </section>
      </Container>
    </>
  );
}
