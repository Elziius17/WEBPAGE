import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { ICON_NAMES } from "@/components/ui/icon";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { saveCategoryAction } from "@/actions/admin/catalog";

export const metadata: Metadata = { title: "Categorías" };

function CategoryFields({ c }: { c?: { id: string; name: string; slug: string; icon: string | null; sortOrder: number; active: boolean; description: string | null } }) {
  const k = c?.id ?? "new";
  return (
    <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_140px_90px_auto_auto]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <FormField name="name" label="Nombre"><Input id={`n-${k}`} name="name" defaultValue={c?.name} /></FormField>
      <FormField name="slug" label="URL"><Input id={`s-${k}`} name="slug" defaultValue={c?.slug} /></FormField>
      <FormField name="icon" label="Ícono"><Select id={`i-${k}`} name="icon" defaultValue={c?.icon ?? "box"}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</Select></FormField>
      <FormField name="sortOrder" label="Orden"><Input id={`o-${k}`} name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} /></FormField>
      <label className="flex h-11 items-center gap-2 text-sm text-fg-muted"><Checkbox name="active" defaultChecked={c?.active ?? true} /> Activa</label>
      <SubmitButton size="md" variant="secondary">{c ? "Guardar" : "Crear"}</SubmitButton>
    </div>
  );
}

export default async function CategoriesPage() {
  await requireStaffPage("products:write");
  const cats = await db.category.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <AdminPageHeader title="Categorías" back={{ href: "/admin/productos", label: "Productos" }} />
      <Panel title="Nueva categoría" className="mb-6"><ActionForm action={saveCategoryAction} resetOnSuccess><CategoryFields /></ActionForm></Panel>
      <Panel title="Categorías existentes">
        <div className="space-y-3">{cats.map((c) => <ActionForm key={c.id} action={saveCategoryAction} className="border-b border-white/5 pb-3"><CategoryFields c={c} /></ActionForm>)}</div>
      </Panel>
    </>
  );
}
