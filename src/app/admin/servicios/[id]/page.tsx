import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { ICON_NAMES } from "@/components/ui/icon";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { centsToSoles } from "@/lib/utils/money";
import { saveServiceAction } from "@/actions/admin/catalog";

export const metadata: Metadata = { title: "Servicio" };

export default async function ServiceEdit({ params }: PageProps<"/admin/servicios/[id]">) {
  await requireStaffPage("services:write");
  const { id } = await params;
  const s = id === "nuevo" ? null : await db.service.findUnique({ where: { id } });
  if (id !== "nuevo" && !s) notFound();
  return (
    <>
      <AdminPageHeader
        title={s ? s.name : "Nuevo servicio"}
        back={{ href: "/admin/servicios", label: "Servicios" }}
      />
      <Panel>
        <ActionForm action={saveServiceAction} redirectPrefix={s ? undefined : "/admin/servicios/"}>
          {s && <input type="hidden" name="id" value={s.id} />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField name="code" label="Código" required>
              <Input id="code" name="code" defaultValue={s?.code} />
            </FormField>
            <FormField name="name" label="Nombre" required className="lg:col-span-2">
              <Input id="name" name="name" defaultValue={s?.name} />
            </FormField>
            <FormField name="icon" label="Ícono">
              <Select id="icon" name="icon" defaultValue={s?.icon ?? "wrench"}>
                {ICON_NAMES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </Select>
            </FormField>
            <FormField name="slug" label="URL (slug)">
              <Input id="slug" name="slug" defaultValue={s?.slug} />
            </FormField>
            <FormField name="estimatedTime" label="Tiempo estimado">
              <Input
                id="estimatedTime"
                name="estimatedTime"
                defaultValue={s?.estimatedTime ?? ""}
                placeholder="p.ej. 24 a 48 horas"
              />
            </FormField>
            <FormField name="referencePriceCents" label="Precio referencial (S/)" hint="Opcional">
              <Input
                id="referencePriceCents"
                name="referencePriceCents"
                inputMode="decimal"
                defaultValue={centsToSoles(s?.referencePriceCents)}
              />
            </FormField>
            <FormField name="sortOrder" label="Orden">
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={s?.sortOrder ?? 0}
              />
            </FormField>
          </div>
          <FormField name="priceNote" label="Nota de precio">
            <Input id="priceNote" name="priceNote" defaultValue={s?.priceNote ?? ""} />
          </FormField>
          <FormField name="shortDescription" label="Descripción corta" required>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={s?.shortDescription}
            />
          </FormField>
          <FormField name="description" label="Descripción" required>
            <Textarea id="description" name="description" rows={4} defaultValue={s?.description} />
          </FormField>
          <div className="grid gap-4 lg:grid-cols-3">
            <FormField name="benefits" label="Beneficios (uno por línea)">
              <Textarea
                id="benefits"
                name="benefits"
                rows={7}
                defaultValue={s?.benefits.join("\n")}
              />
            </FormField>
            <FormField name="activities" label="Actividades (una por línea)">
              <Textarea
                id="activities"
                name="activities"
                rows={7}
                defaultValue={s?.activities.join("\n")}
              />
            </FormField>
            <FormField name="procedure" label="Procedimiento (un paso por línea)">
              <Textarea
                id="procedure"
                name="procedure"
                rows={7}
                defaultValue={s?.procedure.join("\n")}
              />
            </FormField>
          </div>
          <FormField
            name="whatsappMessage"
            label="Mensaje de WhatsApp"
            hint="Vacío = mensaje automático según el servicio"
          >
            <Input
              id="whatsappMessage"
              name="whatsappMessage"
              defaultValue={s?.whatsappMessage ?? ""}
            />
          </FormField>
          <label className="text-fg-muted flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={s?.active ?? true} /> Publicado en el sitio
          </label>
          <SubmitButton>{s ? "Guardar servicio" : "Crear servicio"}</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
