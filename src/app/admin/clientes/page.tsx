import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader, DataTable, FilterBar, Pagination, TableEmpty, sp } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils/dates";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Clientes" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/clientes">) {
  const user = await requireStaffPage("customers:read");
  const q = await searchParams;
  const search = sp(q.q);
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (search) where.OR = [{ fullName: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }, { email: { contains: search, mode: "insensitive" } }, { documentNumber: { contains: search } }, { companyName: { contains: search, mode: "insensitive" } }];
  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { _count: { select: { orders: true, serviceOrders: true } } } }),
  ]);
  return (
    <>
      <AdminPageHeader title="Clientes" description={`${total} cliente(s)`} actions={hasPermission(user.role, "customers:write") && <ButtonLink href="/admin/clientes/nuevo"><Plus /> Nuevo cliente</ButtonLink>} />
      <FilterBar action="/admin/clientes">
        <Input name="q" defaultValue={search} placeholder="Nombre, teléfono, correo, documento" className="w-80" aria-label="Buscar" />
        <Button type="submit" variant="secondary">Buscar</Button>
      </FilterBar>
      <DataTable head={["Cliente", "Contacto", "Documento", "Pedidos", "Servicios", "Cuenta web", "Desde"]} empty={!customers.length && <TableEmpty>Sin clientes.</TableEmpty>}>
        {customers.map((c) => (
          <tr key={c.id}>
            <td><Link href={`/admin/clientes/${c.id}`} className="font-medium text-fg hover:text-brand-cyan">{c.fullName}</Link>{c.companyName && <p className="text-xs text-fg-subtle">{c.companyName}</p>}</td>
            <td className="text-fg-muted"><p>{c.phone}</p><p className="text-xs">{c.email}</p></td>
            <td className="text-fg-muted">{c.documentNumber ? `${c.documentType} ${c.documentNumber}` : "—"}</td>
            <td>{c._count.orders}</td>
            <td>{c._count.serviceOrders}</td>
            <td>{c.userId ? <Badge tone="success">Sí</Badge> : <Badge>No</Badge>}</td>
            <td className="text-xs text-fg-muted">{formatDate(c.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / 25)} buildHref={(n) => `/admin/clientes?${new URLSearchParams({ ...(search ? { q: search } : {}), pagina: String(n) })}`} />
    </>
  );
}
