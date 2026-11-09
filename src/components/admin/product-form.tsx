import { ActionForm, FormField, SubmitButton } from "./action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { saveProductAction } from "@/actions/admin/catalog";
import { centsToSoles, marginPercent } from "@/lib/utils/money";
import { productConditionLabel, productStatusLabel } from "@/config/statuses";
import type { Product } from "@/generated/prisma/client";

export function ProductForm({ product, categories, suppliers }: { product?: Product; categories: { id: string; name: string }[]; suppliers: { id: string; name: string }[] }) {
  const specs = Array.isArray(product?.specs) ? (product.specs as { label: string; value: string }[]).map((s) => `${s.label}: ${s.value}`).join("\n") : "";
  const margin = product ? marginPercent(product.priceCents, product.costCents) : null;
  return (
    <ActionForm action={saveProductAction} redirectPrefix={product ? undefined : "/admin/productos/"} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <section className="surface space-y-4 p-6">
        <h2 className="font-semibold text-fg">Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField name="name" label="Nombre" required className="lg:col-span-2"><Input id="name" name="name" defaultValue={product?.name} /></FormField>
          <FormField name="sku" label="SKU / identificador" required><Input id="sku" name="sku" defaultValue={product?.sku} className="uppercase" /></FormField>
          <FormField name="brand" label="Marca" required><Input id="brand" name="brand" defaultValue={product?.brand} /></FormField>
          <FormField name="model" label="Modelo"><Input id="model" name="model" defaultValue={product?.model ?? ""} /></FormField>
          <FormField name="slug" label="URL (slug)" hint="Vacío = se genera del nombre"><Input id="slug" name="slug" defaultValue={product?.slug} /></FormField>
          <FormField name="categoryId" label="Categoría" required>
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}><option value="">Selecciona…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </FormField>
          <FormField name="supplierId" label="Proveedor">
            <Select id="supplierId" name="supplierId" defaultValue={product?.supplierId ?? ""}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </FormField>
          <FormField name="condition" label="Condición"><Select id="condition" name="condition" defaultValue={product?.condition ?? "NEW"}>{Object.entries(productConditionLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></FormField>
        </div>
        <FormField name="shortDescription" label="Descripción corta"><Input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription ?? ""} /></FormField>
        <FormField name="description" label="Descripción" required><Textarea id="description" name="description" rows={5} defaultValue={product?.description} /></FormField>
        <FormField name="specs" label="Especificaciones técnicas" hint='Una por línea con formato "Etiqueta: valor".'><Textarea id="specs" name="specs" rows={5} defaultValue={specs} className="font-mono text-xs" /></FormField>
      </section>
      <section className="surface space-y-4 p-6">
        <h2 className="font-semibold text-fg">Precio, stock y garantía</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField name="priceCents" label="Precio de venta (S/)" required><Input id="priceCents" name="priceCents" inputMode="decimal" defaultValue={centsToSoles(product?.priceCents)} /></FormField>
          <FormField name="compareAtPriceCents" label="Precio anterior (promoción)"><Input id="compareAtPriceCents" name="compareAtPriceCents" inputMode="decimal" defaultValue={centsToSoles(product?.compareAtPriceCents)} /></FormField>
          <FormField name="costCents" label="Costo de adquisición (S/)" hint={margin != null ? `Margen referencial: ${margin}%` : undefined}><Input id="costCents" name="costCents" inputMode="decimal" defaultValue={centsToSoles(product?.costCents)} /></FormField>
          <FormField name="minStock" label="Stock mínimo (alerta)"><Input id="minStock" name="minStock" type="number" min={0} defaultValue={product?.minStock ?? 1} /></FormField>
          <FormField name="warrantyMonths" label="Garantía (meses)"><Input id="warrantyMonths" name="warrantyMonths" type="number" min={0} defaultValue={product?.warrantyMonths ?? 0} /></FormField>
          <FormField name="weightGrams" label="Peso (g)"><Input id="weightGrams" name="weightGrams" type="number" min={0} defaultValue={product?.weightGrams ?? ""} /></FormField>
          <FormField name="status" label="Estado"><Select id="status" name="status" defaultValue={product?.status ?? "DRAFT"}>{Object.entries(productStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></FormField>
          <div className="flex items-end pb-3"><label className="flex items-center gap-2 text-sm text-fg-muted"><Checkbox name="featured" defaultChecked={product?.featured} /> Destacado en inicio</label></div>
        </div>
        <FormField name="warrantyNotes" label="Notas de garantía"><Input id="warrantyNotes" name="warrantyNotes" defaultValue={product?.warrantyNotes ?? ""} /></FormField>
        {!product && <p className="text-xs text-fg-subtle">El stock inicial se registra después, como movimiento de entrada en Inventario, para mantener la trazabilidad.</p>}
      </section>
      <SubmitButton size="lg">{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
    </ActionForm>
  );
}
