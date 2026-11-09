import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { AdminPageHeader, DataTable, FilterBar, TableEmpty, sp } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { DeliveryStatusBadge } from "@/components/ui/status-badge";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { formatPEN } from "@/lib/utils/money";
import { deliveryStatusLabel } from "@/config/statuses";
import type { Prisma } from "@/generated/prisma/client";
import type { DeliveryStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Entregas" };

export default async function DeliveriesPage({ searchParams }: PageProps<"/admin/entregas">) {
  await requireStaffPage("deliveries:write");
  const q = await searchParams;
  const metodo = sp(q.metodo);
  const estado = sp(q.estado);
  const where: Prisma.DeliveryWhereInput = {};
  if (metodo === "PICKUP" || metodo === "COURIER") where.method = metodo;
  if (estado === "abiertas" || !estado) where.status = { notIn: ["DELIVERED", "CANCELLED"] };
  else if (estado in deliveryStatusLabel) where.status = estado as DeliveryStatus;
  const deliveries = await db.delivery.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      order: { select: { id: true, code: true, contactName: true, status: true } },
      courier: { select: { name: true } },
      address: { select: { district: true, province: true } },
    },
  });
  return (
    <>
      <AdminPageHeader
        title="Entregas"
        description="Recojos presenciales y envíos por courier."
        actions={
          <ButtonLink href="/admin/entregas/configuracion" variant="secondary">
            <Settings2 /> Couriers y zonas
          </ButtonLink>
        }
      />
      <FilterBar action="/admin/entregas">
        <Select name="metodo" defaultValue={metodo ?? ""} className="w-44" aria-label="Modalidad">
          <option value="">Todas las modalidades</option>
          <option value="PICKUP">Recojo</option>
          <option value="COURIER">Courier</option>
        </Select>
        <Select
          name="estado"
          defaultValue={estado ?? "abiertas"}
          className="w-56"
          aria-label="Estado"
        >
          <option value="abiertas">Abiertas</option>
          <option value="todas">Todas</option>
          {Object.entries(deliveryStatusLabel).map(([k, v]) => (
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
        head={[
          "Pedido",
          "Destinatario",
          "Modalidad",
          "Destino / lugar",
          "Courier · guía",
          "Costo",
          "Actualizado",
          "Estado",
        ]}
        minWidth={980}
        empty={!deliveries.length && <TableEmpty>Sin entregas con esos filtros.</TableEmpty>}
      >
        {deliveries.map((d) => (
          <tr key={d.id}>
            <td>
              <Link
                href={`/admin/pedidos/${d.order.id}`}
                className="text-fg hover:text-brand-cyan font-mono font-semibold"
              >
                {d.order.code}
              </Link>
            </td>
            <td>
              <p className="text-fg">{d.recipientName}</p>
              <p className="text-fg-subtle text-xs">{d.recipientPhone}</p>
            </td>
            <td className="text-fg-muted">{d.method === "PICKUP" ? "Recojo" : "Courier"}</td>
            <td className="text-fg-muted">
              {d.method === "COURIER"
                ? d.address
                  ? `${d.address.district}, ${d.address.province}`
                  : "—"
                : (d.pickupLocation ?? "Por coordinar")}
            </td>
            <td className="text-fg-muted">
              {d.courier?.name ?? "—"}
              {d.trackingNumber && (
                <span className="block font-mono text-xs">{d.trackingNumber}</span>
              )}
            </td>
            <td>{d.costCents != null ? formatPEN(d.costCents) : "—"}</td>
            <td className="text-fg-muted text-xs">{formatDateTime(d.updatedAt)}</td>
            <td>
              <DeliveryStatusBadge status={d.status} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
