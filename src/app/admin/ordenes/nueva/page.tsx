import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { ReceptionForm } from "@/components/admin/reception-form";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Registrar recepción" };

export default async function NewServiceOrderPage({
  searchParams,
}: PageProps<"/admin/ordenes/nueva">) {
  const user = await requireStaffPage("service-orders:write");
  const q = await searchParams;
  const [customers, services, technicians] = await Promise.all([
    db.customer.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      take: 500,
      select: { id: true, fullName: true, phone: true, documentNumber: true },
    }),
    db.service.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.technician.findMany({
      where: { active: true, user: { active: true } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Registrar recepción"
        description="Genera la orden de servicio y su código único de seguimiento."
        back={{ href: "/admin/ordenes", label: "Órdenes" }}
      />
      <ReceptionForm
        presetCustomerId={typeof q.cliente === "string" ? q.cliente : undefined}
        customers={customers.map((c) => ({
          id: c.id,
          label: `${c.fullName} · ${c.phone}${c.documentNumber ? ` · ${c.documentNumber}` : ""}`,
        }))}
        services={services.map((s) => ({ id: s.id, label: s.name }))}
        technicians={technicians.map((t) => ({ id: t.id, label: t.user.name }))}
        canAssign={hasPermission(user.role, "service-orders:assign")}
      />
    </>
  );
}
