import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminPageHeader, KeyValue, Panel } from "@/components/admin/ui";
import { CustomerForm } from "@/components/admin/customer-form";
import { ButtonLink } from "@/components/ui/button";
import { OrderStatusBadge, ServiceStatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import { deviceTypeLabel, requestKindLabel, requestStatusLabel } from "@/config/statuses";

export const metadata: Metadata = { title: "Cliente" };

export default async function CustomerDetail({ params }: PageProps<"/admin/clientes/[id]">) {
  const user = await requireStaffPage("customers:read");
  const { id } = await params;
  const c = await db.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true } },
      orders: { orderBy: { createdAt: "desc" }, select: { id: true, code: true, status: true, totalCents: true, createdAt: true } },
      serviceOrders: { orderBy: { receivedAt: "desc" }, select: { id: true, code: true, status: true, receivedAt: true, brand: true, model: true, deviceType: true } },
      serviceRequests: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, kind: true, status: true, createdAt: true, subject: true } },
      addresses: true,
    },
  });
  if (!c) notFound();
  const spent = c.orders.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + o.totalCents, 0);
  const canSeeAllService = hasPermission(user.role, "service-orders:read-all");
  return (
    <>
      <AdminPageHeader
        title={c.fullName}
        description={`${c.phone}${c.email ? ` · ${c.email}` : ""}${c.user ? ` · Cuenta web: ${c.user.email}` : ""}`}
        back={{ href: "/admin/clientes", label: "Clientes" }}
        actions={hasPermission(user.role, "service-orders:write") && <ButtonLink href={`/admin/ordenes/nueva?cliente=${c.id}`}><Plus /> Recibir equipo</ButtonLink>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Pedidos" description={`Total comprado (completado): ${formatPEN(spent)}`}>
            <ul className="divide-y divide-white/5 text-sm">
              {c.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-mono text-fg hover:text-brand-cyan">{o.code}</Link>
                  <span className="text-xs text-fg-subtle">{formatDate(o.createdAt)}</span>
                  <span>{formatPEN(o.totalCents)}</span>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
              {!c.orders.length && <li className="py-2 text-fg-subtle">Sin pedidos.</li>}
            </ul>
          </Panel>
          {canSeeAllService && (
            <Panel title="Servicios técnicos">
              <ul className="divide-y divide-white/5 text-sm">
                {c.serviceOrders.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link href={`/admin/ordenes/${s.id}`} className="font-mono text-fg hover:text-brand-cyan">{s.code}</Link>
                    <span className="text-fg-muted">{deviceTypeLabel[s.deviceType]} · {s.brand} {s.model}</span>
                    <span className="text-xs text-fg-subtle">{formatDate(s.receivedAt)}</span>
                    <ServiceStatusBadge status={s.status} />
                  </li>
                ))}
                {!c.serviceOrders.length && <li className="py-2 text-fg-subtle">Sin órdenes técnicas.</li>}
              </ul>
            </Panel>
          )}
          <Panel title="Solicitudes">
            <ul className="divide-y divide-white/5 text-sm">
              {c.serviceRequests.map((r) => <li key={r.id} className="flex justify-between gap-2 py-2"><span className="text-fg">{requestKindLabel[r.kind]}{r.subject ? ` · ${r.subject}` : ""}</span><span className="text-xs text-fg-subtle">{formatDate(r.createdAt)}</span><Badge>{requestStatusLabel[r.status]}</Badge></li>)}
              {!c.serviceRequests.length && <li className="py-2 text-fg-subtle">Sin solicitudes vinculadas.</li>}
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          {hasPermission(user.role, "customers:write") ? <Panel title="Datos del cliente"><CustomerForm c={c} /></Panel> : <Panel title="Datos"><KeyValue cols={1} items={[["Documento", c.documentNumber], ["Tipo", c.type === "COMPANY" ? "Empresa" : "Persona"]]} /></Panel>}
          {c.addresses.length > 0 && (
            <Panel title="Direcciones">
              <ul className="space-y-2 text-sm text-fg-muted">{c.addresses.map((a) => <li key={a.id}>{a.line1}, {a.district}, {a.province} — {a.recipientName}</li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
