import { ActionForm, FormField, SubmitButton } from "./action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { saveProductAction } from "@/actions/admin/catalog";
import { centsToSoles, marginPercent } from "@/lib/utils/money";
import { productConditionLabel, productStatusLabel } from "@/config/statuses";
import type { Product } from "@/generated/prisma/client";

/** Valores sugeridos por el registro con foto (IA). */
export type ProductFormDraft = {
  name?: string;
  brand?: string;
  model?: string;
  categoryId?: string;
  condition?: "NEW" | "REFURBISHED" | "USED";
  shortDescription?: string;
  description?: string;
  specs?: { label: string; value: string }[];
  warrantyMonths?: number;
};

const VERIFY = "⚠ Sugerido por IA: verifica este dato.";

export function ProductForm({
  product,
  categories,
  suppliers,
  draft,
  uncertain = [],
  pendingImageKeys = [],
}: {
  product?: Product;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  /** Borrador de la IA (solo al crear). */
  draft?: ProductFormDraft;
  /** Campos que la IA marcó como dudosos. */
  uncertain?: string[];
  /** Fotos ya subidas por el registro con IA. */
  pendingImageKeys?: string[];
}) {
  const specList = Array.isArray(product?.specs)
    ? (product.specs as { label: string; value: string }[])
    : (draft?.specs ?? []);
  const specs = specList.map((s) => `${s.label}: ${s.value}`).join("\n");
  const margin = product ? marginPercent(product.priceCents, product.costCents) : null;
  const hint = (field: string, normal?: string) => (uncertain.includes(field) ? VERIFY : normal);
  return (
    <ActionForm
      action={saveProductAction}
      redirectPrefix={product ? undefined : "/admin/productos/"}
      className="space-y-6"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      {pendingImageKeys.map((k) => (
        <input key={k} type="hidden" name="pendingImageKeys" value={k} />
      ))}
      <section className="surface space-y-4 p-6">
        <h2 className="text-fg font-semibold">Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            name="name"
            label="Nombre"
            required
            className="lg:col-span-2"
            hint={hint("name")}
          >
            <Input id="name" name="name" defaultValue={product?.name ?? draft?.name} />
          </FormField>
          <FormField name="sku" label="SKU / identificador" required>
            <Input id="sku" name="sku" defaultValue={product?.sku} className="uppercase" />
          </FormField>
          <FormField name="brand" label="Marca" required hint={hint("brand")}>
            <Input id="brand" name="brand" defaultValue={product?.brand ?? draft?.brand} />
          </FormField>
          <FormField name="model" label="Modelo" hint={hint("model")}>
            <Input id="model" name="model" defaultValue={product?.model ?? draft?.model ?? ""} />
          </FormField>
          <FormField name="slug" label="URL (slug)" hint="Vacío = se genera del nombre">
            <Input id="slug" name="slug" defaultValue={product?.slug} />
          </FormField>
          <FormField name="categoryId" label="Categoría" required hint={hint("category")}>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? draft?.categoryId ?? ""}
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField name="supplierId" label="Proveedor">
            <Select id="supplierId" name="supplierId" defaultValue={product?.supplierId ?? ""}>
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField name="condition" label="Condición" hint={hint("condition")}>
            <Select
              id="condition"
              name="condition"
              defaultValue={product?.condition ?? draft?.condition ?? "NEW"}
            >
              {Object.entries(productConditionLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField name="shortDescription" label="Descripción corta">
          <Input
            id="shortDescription"
            name="shortDescription"
            defaultValue={product?.shortDescription ?? draft?.shortDescription ?? ""}
          />
        </FormField>
        <FormField name="description" label="Descripción" required hint={hint("description")}>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? draft?.description}
          />
        </FormField>
        <FormField
          name="specs"
          label="Especificaciones técnicas"
          hint={hint("specs", 'Una por línea con formato "Etiqueta: valor".')}
        >
          <Textarea
            id="specs"
            name="specs"
            rows={5}
            defaultValue={specs}
            className="font-mono text-xs"
          />
        </FormField>
      </section>
      <section className="surface space-y-4 p-6">
        <h2 className="text-fg font-semibold">Precio, stock y garantía</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField name="priceCents" label="Precio de venta (S/)" required>
            <Input
              id="priceCents"
              name="priceCents"
              inputMode="decimal"
              defaultValue={centsToSoles(product?.priceCents)}
            />
          </FormField>
          <FormField name="compareAtPriceCents" label="Precio anterior (promoción)">
            <Input
              id="compareAtPriceCents"
              name="compareAtPriceCents"
              inputMode="decimal"
              defaultValue={centsToSoles(product?.compareAtPriceCents)}
            />
          </FormField>
          <FormField
            name="costCents"
            label="Costo de adquisición (S/)"
            hint={margin != null ? `Margen referencial: ${margin}%` : undefined}
          >
            <Input
              id="costCents"
              name="costCents"
              inputMode="decimal"
              defaultValue={centsToSoles(product?.costCents)}
            />
          </FormField>
          {!product && (
            <FormField
              name="initialStock"
              label="Stock inicial"
              hint="Se registra como entrada en Inventario."
            >
              <Input id="initialStock" name="initialStock" type="number" min={0} defaultValue={0} />
            </FormField>
          )}
          <FormField name="minStock" label="Stock mínimo (alerta)">
            <Input
              id="minStock"
              name="minStock"
              type="number"
              min={0}
              defaultValue={product?.minStock ?? 1}
            />
          </FormField>
          <FormField name="warrantyMonths" label="Garantía (meses)" hint={hint("warranty")}>
            <Input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={0}
              defaultValue={product?.warrantyMonths ?? draft?.warrantyMonths ?? 0}
            />
          </FormField>
          <FormField name="weightGrams" label="Peso (g)">
            <Input
              id="weightGrams"
              name="weightGrams"
              type="number"
              min={0}
              defaultValue={product?.weightGrams ?? ""}
            />
          </FormField>
          <FormField name="status" label="Estado">
            <Select id="status" name="status" defaultValue={product?.status ?? "DRAFT"}>
              {Object.entries(productStatusLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex items-end pb-3">
            <label className="text-fg-muted flex items-center gap-2 text-sm">
              <Checkbox name="featured" defaultChecked={product?.featured} /> Destacado en inicio
            </label>
          </div>
        </div>
        <FormField name="warrantyNotes" label="Notas de garantía">
          <Input
            id="warrantyNotes"
            name="warrantyNotes"
            defaultValue={product?.warrantyNotes ?? ""}
          />
        </FormField>
      </section>
      <SubmitButton size="lg">{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
    </ActionForm>
  );
}
