import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { centsToSoles } from "@/lib/utils/money";
import { saveCourierAction, saveZoneAction } from "@/actions/admin/commerce";
import type { Courier, DeliveryZone } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Couriers y zonas" };

function CourierFields({ c }: { c?: Courier }) {
  const k = c?.id ?? "new";
  return (
    <div className="grid items-end gap-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <FormField name="name" label="Nombre" required><Input id={`cn-${k}`} name="name" defaultValue={c?.name} /></FormField>
      <FormField name="website" label="Sitio web"><Input id={`cw-${k}`} name="website" defaultValue={c?.website ?? ""} placeholder="https://" /></FormField>
      <FormField name="phone" label="Teléfono"><Input id={`cp-${k}`} name="phone" defaultValue={c?.phone ?? ""} /></FormField>
      <FormField name="trackingUrlTemplate" label="URL de rastreo" hint="Usa {code} para la guía"><Input id={`ct-${k}`} name="trackingUrlTemplate" defaultValue={c?.trackingUrlTemplate ?? ""} /></FormField>
      <label className="flex h-11 items-center gap-2 text-sm text-fg-muted"><Checkbox name="active" defaultChecked={c?.active ?? true} /> Activo</label>
      <SubmitButton variant="secondary">{c ? "Guardar" : "Registrar"}</SubmitButton>
    </div>
  );
}

function ZoneFields({ z }: { z?: DeliveryZone }) {
  const k = z?.id ?? "new";
  return (
    <div className="grid items-end gap-3 lg:grid-cols-[1fr_1.5fr_140px_1fr_auto_auto]">
      {z && <input type="hidden" name="id" value={z.id} />}
      <FormField name="name" label="Zona" required><Input id={`zn-${k}`} name="name" defaultValue={z?.name} /></FormField>
      <FormField name="description" label="Descripción"><Input id={`zd-${k}`} name="description" defaultValue={z?.description ?? ""} /></FormField>
      <FormField name="baseCostCents" label="Costo (S/)" hint="Vacío = cotizar"><Input id={`zc-${k}`} name="baseCostCents" inputMode="decimal" defaultValue={centsToSoles(z?.baseCostCents)} /></FormField>
      <FormField name="estimatedTime" label="Tiempo estimado"><Input id={`zt-${k}`} name="estimatedTime" defaultValue={z?.estimatedTime ?? ""} /></FormField>
      <label className="flex h-11 items-center gap-2 text-sm text-fg-muted"><Checkbox name="active" defaultChecked={z?.active ?? true} /> Activa</label>
      <SubmitButton variant="secondary">{z ? "Guardar" : "Crear"}</SubmitButton>
    </div>
  );
}

export default async function DeliveryConfigPage() {
  await requireStaffPage("deliveries:write");
  const [couriers, zones] = await Promise.all([db.courier.findMany({ orderBy: { name: "asc" } }), db.deliveryZone.findMany({ orderBy: { name: "asc" } })]);
  return (
    <>
      <AdminPageHeader title="Couriers y zonas de envío" back={{ href: "/admin/entregas", label: "Entregas" }} />
      <Alert tone="info" className="mb-6">Registra solo tarifas y tiempos confirmados con tus couriers. Si una zona no tiene costo, el envío se cotizará caso a caso.</Alert>
      <Panel title="Couriers" className="mb-6">
        <ActionForm action={saveCourierAction} resetOnSuccess className="mb-5 border-b border-white/8 pb-5"><CourierFields /></ActionForm>
        <div className="space-y-3">{couriers.map((c) => <ActionForm key={c.id} action={saveCourierAction}><CourierFields c={c} /></ActionForm>)}</div>
      </Panel>
      <Panel title="Zonas de envío">
        <ActionForm action={saveZoneAction} resetOnSuccess className="mb-5 border-b border-white/8 pb-5"><ZoneFields /></ActionForm>
        <div className="space-y-3">{zones.map((z) => <ActionForm key={z.id} action={saveZoneAction}><ZoneFields z={z} /></ActionForm>)}</div>
      </Panel>
    </>
  );
}
