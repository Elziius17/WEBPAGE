import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, PackageX } from "lucide-react";
import {
  AdminPageHeader,
  DataTable,
  FilterBar,
  Pagination,
  Panel,
  StatCard,
  TableEmpty,
  sp,
} from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { formatPEN } from "@/lib/utils/money";
import { movementTypeLabel } from "@/config/statuses";
import { getLowStockProducts } from "@/services/inventory";
import { registerMovementAction } from "@/actions/admin/catalog";
import type { Prisma } from "@/generated/prisma/client";
import type { InventoryMovementType } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventario">) {
  const user = await requireStaffPage("inventory:read");
  const q = await searchParams;
  const productId = sp(q.producto, 40);
  const type = sp(q.tipo, 20);
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.InventoryMovementWhereInput = {};
  if (productId) where.productId = productId;
  if (type && type in movementTypeLabel) where.type = type as InventoryMovementType;

  const [products, suppliers, lowStock, outOfStock, total, movements, valuation] =
    await Promise.all([
      db.product.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, sku: true, stock: true, reserved: true },
      }),
      db.supplier.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      getLowStockProducts(50),
      db.product.count({ where: { deletedAt: null, status: "ACTIVE", stock: 0 } }),
      db.inventoryMovement.count({ where }),
      db.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 30,
        take: 30,
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      }),
      db.$queryRaw<
        { units: bigint; cost: bigint | null; retail: bigint | null }[]
      >`SELECT COALESCE(SUM("stock"),0)::bigint AS units, SUM("stock" * COALESCE("costCents",0))::bigint AS cost, SUM("stock" * "priceCents")::bigint AS retail FROM "Product" WHERE "deletedAt" IS NULL`,
    ]);
  const v = valuation[0];
  const canWrite = hasPermission(user.role, "inventory:write");

  return (
    <>
      <AdminPageHeader
        title="Inventario"
        description="Control de existencias con trazabilidad de cada movimiento."
        actions={
          hasPermission(user.role, "suppliers:write") && (
            <ButtonLink href="/admin/inventario/proveedores" variant="secondary">
              <Building2 /> Proveedores
            </ButtonLink>
          )
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unidades en stock" value={Number(v?.units ?? 0)} icon={Building2} />
        <StatCard
          label="Valor a costo"
          value={formatPEN(Number(v?.cost ?? 0))}
          hint="Productos con costo registrado"
          icon={Building2}
          tone="info"
        />
        <StatCard
          label="Stock bajo"
          value={lowStock.length}
          icon={AlertTriangle}
          tone={lowStock.length ? "warning" : "success"}
        />
        <StatCard
          label="Agotados"
          value={outOfStock}
          icon={PackageX}
          tone={outOfStock ? "danger" : "success"}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <FilterBar action="/admin/inventario">
            <Select
              name="producto"
              defaultValue={productId ?? ""}
              className="w-72"
              aria-label="Producto"
            >
              <option value="">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select name="tipo" defaultValue={type ?? ""} className="w-44" aria-label="Tipo">
              <option value="">Todos los tipos</option>
              {Object.entries(movementTypeLabel).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </FilterBar>
          <DataTable
            head={[
              "Fecha",
              "Producto",
              "Tipo",
              "Stock",
              "Reserva",
              "Saldo",
              "Responsable",
              "Motivo / referencia",
            ]}
            minWidth={900}
            empty={!movements.length && <TableEmpty>Sin movimientos.</TableEmpty>}
          >
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="text-fg-muted text-xs whitespace-nowrap">
                  {formatDateTime(m.createdAt)}
                </td>
                <td>
                  <Link
                    href={`/admin/productos/${m.productId}`}
                    className="text-fg hover:text-brand-cyan"
                  >
                    {m.product.name}
                  </Link>
                </td>
                <td>
                  <Badge>{movementTypeLabel[m.type]}</Badge>
                </td>
                <td
                  className={
                    m.stockDelta > 0
                      ? "text-success"
                      : m.stockDelta < 0
                        ? "text-danger"
                        : "text-fg-subtle"
                  }
                >
                  {m.stockDelta > 0 ? "+" : ""}
                  {m.stockDelta}
                </td>
                <td className="text-fg-muted">
                  {m.reservedDelta
                    ? m.reservedDelta > 0
                      ? `+${m.reservedDelta}`
                      : m.reservedDelta
                    : "—"}
                </td>
                <td className="text-fg">
                  {m.stockAfter}
                  {m.reservedAfter ? (
                    <span className="text-fg-subtle text-xs"> ({m.reservedAfter} res.)</span>
                  ) : null}
                </td>
                <td className="text-fg-muted">{m.user?.name ?? "Sistema"}</td>
                <td className="text-fg-muted text-xs">
                  {[m.reason, m.reference, m.supplier?.name].filter(Boolean).join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            page={page}
            pages={Math.ceil(total / 30)}
            buildHref={(n) =>
              `/admin/inventario?${new URLSearchParams({ ...(productId ? { producto: productId } : {}), ...(type ? { tipo: type } : {}), pagina: String(n) })}`
            }
          />
        </div>
        <div className="space-y-6">
          {canWrite && (
            <Panel
              title="Registrar movimiento"
              description="Toda operación queda registrada con fecha, hora y responsable."
            >
              <ActionForm action={registerMovementAction} resetOnSuccess>
                <FormField name="productId" label="Producto" required>
                  <Select id="mv-product" name="productId" defaultValue={productId ?? ""}>
                    <option value="">Selecciona…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · stock {p.stock} (disp. {p.stock - p.reserved})
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="type" label="Tipo">
                    <Select id="mv-type" name="type">
                      <option value="ENTRY">Entrada</option>
                      <option value="EXIT">Salida</option>
                      <option value="ADJUSTMENT">Ajuste (conteo)</option>
                      <option value="RETURN">Devolución</option>
                    </Select>
                  </FormField>
                  <FormField name="quantity" label="Cantidad" hint="En ajuste: conteo físico total">
                    <Input id="mv-qty" name="quantity" type="number" min={0} />
                  </FormField>
                </div>
                <FormField name="reason" label="Motivo" hint="Obligatorio en ajustes">
                  <Input id="mv-reason" name="reason" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="reference" label="Referencia / documento">
                    <Input id="mv-ref" name="reference" placeholder="Factura, guía…" />
                  </FormField>
                  <FormField name="unitCostCents" label="Costo unit. (S/)">
                    <Input id="mv-cost" name="unitCostCents" inputMode="decimal" />
                  </FormField>
                </div>
                <FormField name="supplierId" label="Proveedor">
                  <Select id="mv-sup" name="supplierId">
                    <option value="">—</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <SubmitButton className="w-full">Registrar movimiento</SubmitButton>
              </ActionForm>
            </Panel>
          )}
          <Panel title="Alertas de stock mínimo">
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-fg hover:text-brand-cyan truncate"
                  >
                    {p.name}
                  </Link>
                  <Badge tone={p.stock - p.reserved <= 0 ? "danger" : "warning"}>
                    {p.stock - p.reserved <= 0
                      ? "Agotado"
                      : `${p.stock - p.reserved} / ${p.minStock}`}
                  </Badge>
                </li>
              ))}
              {!lowStock.length && <li className="text-fg-subtle">Sin alertas.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
