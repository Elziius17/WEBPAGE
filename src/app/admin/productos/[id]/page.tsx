import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Input } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { movementTypeLabel } from "@/config/statuses";
import { deleteProductAction, deleteProductImageAction, uploadProductImagesAction } from "@/actions/admin/catalog";

export const metadata: Metadata = { title: "Producto" };

export default async function ProductDetail({ params }: PageProps<"/admin/productos/[id]">) {
  const user = await requireStaffPage("products:read");
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, movements: { orderBy: { createdAt: "desc" }, take: 15, include: { user: { select: { name: true } } } } },
  });
  if (!product) notFound();
  const [categories, suppliers] = await Promise.all([
    db.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const canWrite = hasPermission(user.role, "products:write") && !product.deletedAt;
  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`SKU ${product.sku} · Stock ${product.stock} · Reservado ${product.reserved} · Disponible ${product.stock - product.reserved}${product.deletedAt ? " · ARCHIVADO" : ""}`}
        back={{ href: "/admin/productos", label: "Productos" }}
        actions={<a href={`/tienda/${product.slug}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink /> Ver en tienda</a>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {canWrite ? <ProductForm product={product} categories={categories} suppliers={suppliers} /> : <Panel title="Solo lectura"><p className="text-sm text-fg-muted">No tienes permisos de edición o el producto está archivado.</p></Panel>}
        <div className="space-y-6">
          <Panel title="Fotografías" description="JPG, PNG o WEBP · máx. 5 MB · hasta 10">
            <ul className="mb-4 grid grid-cols-3 gap-2">
              {product.images.map((img) => (
                <li key={img.id} className="group relative overflow-hidden rounded-lg border border-white/8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" />
                  {canWrite && (
                    <ActionForm action={deleteProductImageAction} className="absolute top-1 right-1 space-y-0" successMessage={false} confirm="¿Eliminar esta imagen?">
                      <input type="hidden" name="imageId" value={img.id} />
                      <button type="submit" className="grid size-7 cursor-pointer place-items-center rounded-md bg-ink-950/80 text-danger" aria-label="Eliminar imagen"><Trash2 className="size-3.5" /></button>
                    </ActionForm>
                  )}
                </li>
              ))}
            </ul>
            {!product.images.length && <p className="mb-4 text-sm text-fg-subtle">Sin fotografías.</p>}
            {canWrite && (
              <ActionForm action={uploadProductImagesAction} resetOnSuccess>
                <input type="hidden" name="productId" value={product.id} />
                <FormField name="files" label="Agregar imágenes"><Input id="files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp" className="py-2" /></FormField>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Subiendo…">Subir</SubmitButton>
              </ActionForm>
            )}
          </Panel>
          <Panel title="Últimos movimientos" actions={<Link href={`/admin/inventario?producto=${product.id}`} className="text-xs text-brand-cyan hover:underline">Registrar / ver todo</Link>}>
            <ul className="space-y-2 text-sm">
              {product.movements.map((m) => (
                <li key={m.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                  <div><p className="text-fg">{movementTypeLabel[m.type]} <span className={m.stockDelta >= 0 ? "text-success" : "text-danger"}>{m.stockDelta >= 0 ? "+" : ""}{m.stockDelta}</span>{m.reservedDelta !== 0 && <span className="text-fg-subtle"> (res. {m.reservedDelta > 0 ? "+" : ""}{m.reservedDelta})</span>}</p><p className="text-xs text-fg-subtle">{formatDateTime(m.createdAt)} · {m.user?.name ?? "Sistema"}{m.reason ? ` · ${m.reason}` : ""}</p></div>
                  <span className="text-xs text-fg-muted">→ {m.stockAfter}</span>
                </li>
              ))}
              {!product.movements.length && <li className="text-fg-subtle">Sin movimientos.</li>}
            </ul>
          </Panel>
          {hasPermission(user.role, "products:delete") && !product.deletedAt && (
            <Panel title="Zona de riesgo">
              <ActionForm action={deleteProductAction} confirm="¿Eliminar o archivar este producto?" redirectTo="/admin/productos">
                <input type="hidden" name="id" value={product.id} />
                <p className="text-xs text-fg-subtle">Si el producto tiene ventas o movimientos, se archivará (eliminación lógica) para conservar la trazabilidad.</p>
                <SubmitButton variant="danger" size="sm">Eliminar producto</SubmitButton>
              </ActionForm>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
