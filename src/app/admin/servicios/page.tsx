import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/ui/icon";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Catálogo de servicios" };

export default async function ServicesAdmin() {
  await requireStaffPage("services:write");
  const services = await db.service.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { orders: true, requests: true } } },
  });
  return (
    <>
      <AdminPageHeader
        title="Catálogo de servicios"
        actions={
          <ButtonLink href="/admin/servicios/nuevo">
            <Plus /> Nuevo servicio
          </ButtonLink>
        }
      />
      <DataTable
        head={[
          "",
          "Código",
          "Servicio",
          "Tiempo estimado",
          "Precio referencial",
          "Órdenes",
          "Solicitudes",
          "Estado",
        ]}
      >
        {services.map((s) => (
          <tr key={s.id}>
            <td>
              <DynamicIcon name={s.icon} className="text-brand-cyan size-5" />
            </td>
            <td className="text-fg-muted font-mono">{s.code}</td>
            <td>
              <Link
                href={`/admin/servicios/${s.id}`}
                className="text-fg hover:text-brand-cyan font-medium"
              >
                {s.name}
              </Link>
            </td>
            <td className="text-fg-muted">{s.estimatedTime ?? "—"}</td>
            <td>{s.referencePriceCents ? formatPEN(s.referencePriceCents) : "—"}</td>
            <td>{s._count.orders}</td>
            <td>{s._count.requests}</td>
            <td>
              <Badge tone={s.active ? "success" : "neutral"}>
                {s.active ? "Activo" : "Inactivo"}
              </Badge>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
