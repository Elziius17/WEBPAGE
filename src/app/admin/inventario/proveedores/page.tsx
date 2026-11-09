import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input } from "@/components/ui/form";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { saveSupplierAction } from "@/actions/admin/catalog";
import type { Supplier } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Proveedores" };

function SupplierFields({ s }: { s?: Supplier & { _count?: { products: number } } }) {
  const k = s?.id ?? "new";
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField name="name" label="Razón social / nombre" required><Input id={`n-${k}`} name="name" defaultValue={s?.name} /></FormField>
        <FormField name="ruc" label="RUC"><Input id={`r-${k}`} name="ruc" defaultValue={s?.ruc ?? ""} inputMode="numeric" /></FormField>
        <FormField name="contactName" label="Contacto"><Input id={`c-${k}`} name="contactName" defaultValue={s?.contactName ?? ""} /></FormField>
        <FormField name="phone" label="Teléfono"><Input id={`p-${k}`} name="phone" defaultValue={s?.phone ?? ""} /></FormField>
        <FormField name="email" label="Correo"><Input id={`e-${k}`} name="email" defaultValue={s?.email ?? ""} /></FormField>
        <FormField name="address" label="Dirección"><Input id={`a-${k}`} name="address" defaultValue={s?.address ?? ""} /></FormField>
        <FormField name="notes" label="Notas" className="lg:col-span-2"><Input id={`no-${k}`} name="notes" defaultValue={s?.notes ?? ""} /></FormField>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-fg-muted"><Checkbox name="active" defaultChecked={s?.active ?? true} /> Activo</label>
        {s?._count && <span className="text-xs text-fg-subtle">{s._count.products} producto(s)</span>}
        <SubmitButton size="sm" variant="secondary">{s ? "Guardar" : "Registrar proveedor"}</SubmitButton>
      </div>
    </>
  );
}

export default async function SuppliersPage() {
  await requireStaffPage("suppliers:write");
  const suppliers = await db.supplier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <AdminPageHeader title="Proveedores" back={{ href: "/admin/inventario", label: "Inventario" }} />
      <Panel title="Nuevo proveedor" className="mb-6"><ActionForm action={saveSupplierAction} resetOnSuccess><SupplierFields /></ActionForm></Panel>
      <div className="space-y-4">
        {suppliers.map((s) => <Panel key={s.id}><ActionForm action={saveSupplierAction}><SupplierFields s={s} /></ActionForm></Panel>)}
        {!suppliers.length && <p className="text-sm text-fg-subtle">Aún no hay proveedores registrados.</p>}
      </div>
    </>
  );
}
