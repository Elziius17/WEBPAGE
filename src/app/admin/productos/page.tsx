import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { AdminPageHeader, DataTable, FilterBar, Pagination, TableEmpty, sp } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { productStatusLabel } from "@/config/statuses";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/productos">) {
  const user = await requireStaffPage("products:read");
  const q = await searchParams;
  const search = sp(q.q);
  const status = sp(q.estado);
  const cat = sp(q.categoria);
  const archived = sp(q.archivados) === "1";
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.ProductWhereInput = { deletedAt: archived ? { not: null } : null };
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }, { brand: { contains: search, mode: "insensitive" } }];
  if (status && status in productStatusLabel) where.status = status as ProductStatus;
  if (cat) where.categoryId = cat;
  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { category: { select: { name: true } }, _count: { select: { images: true } } } }),
    db.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const canWrite = hasPermission(user.role, "products:write");
  return (
    <>
      <AdminPageHeader
        title="Productos"
        description={`${total} producto(s)`}
        actions={canWrite && <><ButtonLink href="/admin/productos/categorias" variant="secondary"><Tags /> Categorías</ButtonLink><ButtonLink href="/admin/productos/nuevo"><Plus /> Nuevo producto</ButtonLink></>}
      />
      <FilterBar action="/admin/productos">
        <Input name="q" defaultValue={search} placeholder="Nombre, SKU o marca" className="w-64" aria-label="Buscar" />
        <Select name="categoria" defaultValue={cat ?? ""} className="w-48" aria-label="Categoría"><option value="">Todas las categorías</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select name="estado" defaultValue={status ?? ""} className="w-40" aria-label="Estado"><option value="">Todos</option>{Object.entries(productStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <label className="flex h-11 items-center gap-2 text-sm text-fg-muted"><input type="checkbox" name="archivados" value="1" defaultChecked={archived} className="accent-brand-cyan" /> Archivados</label>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </FilterBar>
      <DataTable head={["Producto", "SKU", "Categoría", "Precio", "Stock", "Reservado", "Estado"]} empty={!products.length && <TableEmpty>Sin productos.</TableEmpty>}>
        {products.map((p) => {
          const available = p.stock - p.reserved;
          return (
            <tr key={p.id}>
              <td><Link href={`/admin/productos/${p.id}`} className="font-medium text-fg hover:text-brand-cyan">{p.name}</Link><p className="text-xs text-fg-subtle">{p.brand} · {p._count.images} foto(s){p.featured ? " · Destacado" : ""}</p></td>
              <td className="font-mono text-xs text-fg-muted">{p.sku}</td>
              <td className="text-fg-muted">{p.category.name}</td>
              <td>{formatPEN(p.priceCents)}</td>
              <td><span className={available <= p.minStock ? "font-semibold text-warning" : "text-fg"}>{p.stock}</span></td>
              <td className="text-fg-muted">{p.reserved}</td>
              <td><Badge tone={p.status === "ACTIVE" ? "success" : p.status === "DRAFT" ? "neutral" : "warning"}>{productStatusLabel[p.status]}</Badge>{p.isDemo && <Badge tone="warning" className="ml-1">DEMO</Badge>}</td>
            </tr>
          );
        })}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / 25)} buildHref={(n) => `/admin/productos?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(status ? { estado: status } : {}), ...(cat ? { categoria: cat } : {}), pagina: String(n) })}`} />
    </>
  );
}
