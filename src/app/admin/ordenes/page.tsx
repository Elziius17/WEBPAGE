import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AdminPageHeader,
  DataTable,
  FilterBar,
  Pagination,
  TableEmpty,
  sp,
} from "@/components/admin/ui";
import { ButtonLink, Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { ServiceStatusBadge } from "@/components/ui/status-badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { serviceOrderScope } from "@/services/service-orders";
import { deviceTypeLabel, serviceOrderStatusLabel } from "@/config/statuses";
import { formatDate } from "@/lib/utils/dates";
import type { Prisma } from "@/generated/prisma/client";
import type { ServiceOrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Órdenes de servicio" };

const groups: Record<string, ServiceOrderStatus[]> = {
  proceso: ["RECEIVED", "IN_DIAGNOSIS", "APPROVED", "IN_REPAIR", "IN_TESTING"],
  aprobacion: ["QUOTE_SENT", "PENDING_APPROVAL"],
  listos: ["READY_FOR_DELIVERY"],
  cerrados: ["DELIVERED", "CANCELLED"],
};

export default async function ServiceOrdersPage({ searchParams }: PageProps<"/admin/ordenes">) {
  const user = await requireStaffPage("service-orders:read");
  const q = await searchParams;
  const search = sp(q.q, 80);
  const estado = sp(q.estado, 30);
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const pageSize = 20;

  const where: Prisma.ServiceOrderWhereInput = { ...(await serviceOrderScope(user)) };
  if (estado && groups[estado]) where.status = { in: groups[estado] };
  else if (estado && estado in serviceOrderStatusLabel) where.status = estado as ServiceOrderStatus;
  if (search)
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search } } },
    ];

  const [total, orders] = await Promise.all([
    db.serviceOrder.count({ where }),
    db.serviceOrder.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { fullName: true, phone: true } },
        technician: { select: { user: { select: { name: true } } } },
        service: { select: { name: true } },
      },
    }),
  ]);
  const qs = (p: number) =>
    `/admin/ordenes?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(estado ? { estado } : {}), pagina: String(p) })}`;

  return (
    <>
      <AdminPageHeader
        title="Órdenes de servicio"
        description={
          hasPermission(user.role, "service-orders:read-all")
            ? "Todas las órdenes técnicas."
            : "Órdenes asignadas a ti."
        }
        actions={
          hasPermission(user.role, "service-orders:write") && (
            <ButtonLink href="/admin/ordenes/nueva">
              <Plus /> Registrar recepción
            </ButtonLink>
          )
        }
      />
      <FilterBar action="/admin/ordenes">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Código, cliente, teléfono, marca, serie…"
          className="w-72"
          aria-label="Buscar"
        />
        <Select name="estado" defaultValue={estado ?? ""} className="w-56" aria-label="Estado">
          <option value="">Todos los estados</option>
          <optgroup label="Grupos">
            <option value="proceso">En proceso</option>
            <option value="aprobacion">Pendientes de aprobación</option>
            <option value="listos">Listos para entrega</option>
            <option value="cerrados">Cerrados</option>
          </optgroup>
          <optgroup label="Estado">
            {Object.entries(serviceOrderStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </optgroup>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </FilterBar>
      <DataTable
        head={["Código", "Recepción", "Cliente", "Equipo", "Servicio", "Técnico", "Estado"]}
        empty={!orders.length && <TableEmpty>No hay órdenes con esos filtros.</TableEmpty>}
      >
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <Link
                href={`/admin/ordenes/${o.id}`}
                className="text-fg hover:text-brand-cyan font-mono font-semibold"
              >
                {o.code}
              </Link>
              {o.isDemo && <span className="text-warning ml-1 text-[10px]">DEMO</span>}
            </td>
            <td className="text-fg-muted whitespace-nowrap">{formatDate(o.receivedAt)}</td>
            <td>
              <p className="text-fg">{o.customer.fullName}</p>
              <p className="text-fg-subtle text-xs">{o.customer.phone}</p>
            </td>
            <td className="text-fg-muted">
              {deviceTypeLabel[o.deviceType]} · {o.brand} {o.model}
            </td>
            <td className="text-fg-muted">{o.service?.name ?? "—"}</td>
            <td className="text-fg-muted">
              {o.technician?.user.name ?? <span className="text-warning">Sin asignar</span>}
            </td>
            <td>
              <ServiceStatusBadge status={o.status} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / pageSize)} buildHref={qs} />
    </>
  );
}
