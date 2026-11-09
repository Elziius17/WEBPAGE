import type { Metadata } from "next";
import Link from "next/link";
import {
  AdminPageHeader,
  DataTable,
  FilterBar,
  Pagination,
  TableEmpty,
  sp,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { OrderStatusBadge, DeliveryStatusBadge } from "@/components/ui/status-badge";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/dates";
import { orderStatusLabel } from "@/config/statuses";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireStaffPage("orders:read");
  const q = await searchParams;
  const search = sp(q.q);
  const estado = sp(q.estado);
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.OrderWhereInput = {};
  if (estado === "activos")
    where.status = { in: ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY"] };
  else if (estado && estado in orderStatusLabel) where.status = estado as OrderStatus;
  if (search)
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { contactName: { contains: search, mode: "insensitive" } },
      { contactPhone: { contains: search } },
      { contactEmail: { contains: search, mode: "insensitive" } },
    ];
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
      include: {
        delivery: { select: { status: true, method: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);
  return (
    <>
      <AdminPageHeader title="Pedidos" description={`${total} pedido(s)`} />
      <FilterBar action="/admin/pedidos">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Código, nombre, teléfono, correo"
          className="w-72"
          aria-label="Buscar"
        />
        <Select name="estado" defaultValue={estado ?? ""} className="w-56" aria-label="Estado">
          <option value="">Todos</option>
          <option value="activos">Activos (sin completar)</option>
          {Object.entries(orderStatusLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </FilterBar>
      <DataTable
        head={["Código", "Fecha", "Cliente", "Ítems", "Total", "Entrega", "Estado"]}
        empty={!orders.length && <TableEmpty>Sin pedidos.</TableEmpty>}
      >
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <Link
                href={`/admin/pedidos/${o.id}`}
                className="text-fg hover:text-brand-cyan font-mono font-semibold"
              >
                {o.code}
              </Link>
            </td>
            <td className="text-fg-muted text-xs whitespace-nowrap">
              {formatDateTime(o.createdAt)}
            </td>
            <td>
              <p className="text-fg">{o.contactName}</p>
              <p className="text-fg-subtle text-xs">{o.contactPhone}</p>
            </td>
            <td className="text-fg-muted">{o._count.items}</td>
            <td>
              {formatPEN(o.totalCents)}
              {o.shippingCents == null && (
                <span className="text-warning block text-[11px]">+ envío por cotizar</span>
              )}
            </td>
            <td>
              {o.delivery && (
                <>
                  <p className="text-fg-subtle mb-1 text-xs">
                    {o.delivery.method === "PICKUP" ? "Recojo" : "Courier"}
                  </p>
                  <DeliveryStatusBadge status={o.delivery.status} />
                </>
              )}
            </td>
            <td>
              <OrderStatusBadge status={o.status} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination
        page={page}
        pages={Math.ceil(total / 25)}
        buildHref={(n) =>
          `/admin/pedidos?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(estado ? { estado } : {}), pagina: String(n) })}`
        }
      />
    </>
  );
}
