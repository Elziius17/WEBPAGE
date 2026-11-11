import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getBusinessSettings, getQcTemplate } from "@/services/settings";
import {
  deleteTestimonialAction,
  saveBusinessSettingsAction,
  saveQcTemplateAction,
  saveTestimonialAction,
} from "@/actions/admin/management";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  await requireStaffPage("settings:write");
  const [s, qc, testimonials] = await Promise.all([
    getBusinessSettings(),
    getQcTemplate(),
    db.testimonial.findMany({ orderBy: [{ approved: "asc" }, { updatedAt: "desc" }] }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Configuración del negocio"
        description="Datos que se muestran en el sitio, documentos y mensajes. No se publican datos que no registres aquí."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Identidad comercial, contacto y políticas">
          <ActionForm action={saveBusinessSettingsAction}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="commercialName" label="Nombre comercial / razón social" required>
                <Input id="commercialName" name="commercialName" defaultValue={s.commercialName} />
              </FormField>
              <FormField name="ruc" label="RUC">
                <Input id="ruc" name="ruc" defaultValue={s.ruc} inputMode="numeric" />
              </FormField>
              <FormField
                name="whatsapp"
                label="WhatsApp comercial"
                hint="Formato internacional sin + ni espacios, p.ej. 519XXXXXXXX"
              >
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={s.whatsapp}
                  inputMode="numeric"
                />
              </FormField>
              <FormField name="phone" label="Teléfono">
                <Input id="phone" name="phone" defaultValue={s.phone} />
              </FormField>
              <FormField name="email" label="Correo">
                <Input id="email" name="email" type="email" defaultValue={s.email} />
              </FormField>
              <FormField name="city" label="Ciudad">
                <Input id="city" name="city" defaultValue={s.city} />
              </FormField>
              <FormField name="address" label="Dirección" className="sm:col-span-2">
                <Input id="address" name="address" defaultValue={s.address} />
              </FormField>
            </div>
            <FormField name="schedule" label="Horario de atención">
              <Textarea
                id="schedule"
                name="schedule"
                rows={2}
                defaultValue={s.schedule}
                placeholder={"Lun a Vie: …\nSáb: …"}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="pickupInstructions" label="Instrucciones de recojo presencial">
                <Textarea
                  id="pickupInstructions"
                  name="pickupInstructions"
                  rows={2}
                  defaultValue={s.pickupInstructions}
                />
              </FormField>
              <FormField name="courierNotes" label="Notas de envíos">
                <Textarea
                  id="courierNotes"
                  name="courierNotes"
                  rows={2}
                  defaultValue={s.courierNotes}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <FormField name="serviceWarrantyDays" label="Garantía de servicio (días)">
                <Input
                  id="serviceWarrantyDays"
                  name="serviceWarrantyDays"
                  type="number"
                  min={0}
                  defaultValue={s.serviceWarrantyDays}
                />
              </FormField>
              <FormField name="warrantyText" label="Condiciones de garantía por defecto">
                <Textarea
                  id="warrantyText"
                  name="warrantyText"
                  rows={2}
                  defaultValue={s.warrantyText}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField name="facebook" label="Facebook (URL)">
                <Input id="facebook" name="facebook" defaultValue={s.facebook} />
              </FormField>
              <FormField name="instagram" label="Instagram (URL)">
                <Input id="instagram" name="instagram" defaultValue={s.instagram} />
              </FormField>
              <FormField name="tiktok" label="TikTok (URL)">
                <Input id="tiktok" name="tiktok" defaultValue={s.tiktok} />
              </FormField>
            </div>
            <SubmitButton>Guardar configuración</SubmitButton>
          </ActionForm>
        </Panel>
        <div className="space-y-6">
          <Panel
            title="Checklist de control de calidad"
            description="Un punto por línea. Se usa en cada orden técnica."
          >
            <ActionForm action={saveQcTemplateAction}>
              <Textarea
                name="items"
                rows={9}
                defaultValue={qc.join("\n")}
                aria-label="Puntos del checklist"
              />
              <SubmitButton size="sm" variant="secondary">
                Guardar checklist
              </SubmitButton>
            </ActionForm>
          </Panel>
          <Panel
            title="Testimonios"
            description="Los clientes registrados envían su opinión desde «Mi cuenta» y queda pendiente hasta que la publiques aquí. Publica solo testimonios reales con autorización del cliente."
          >
            <ActionForm
              action={saveTestimonialAction}
              resetOnSuccess
              className="mb-5 border-b border-white/8 pb-5"
            >
              <FormField name="authorName" label="Autor" required>
                <Input id="t-author" name="authorName" />
              </FormField>
              <FormField name="authorRole" label="Cargo / referencia">
                <Input id="t-role" name="authorRole" />
              </FormField>
              <FormField name="content" label="Testimonio" required>
                <Textarea id="t-content" name="content" rows={3} />
              </FormField>
              <div className="flex items-center gap-4">
                <FormField name="rating" label="Valoración">
                  <Select id="t-rating" name="rating" defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </Select>
                </FormField>
                <label className="text-fg-muted mt-6 flex items-center gap-2 text-sm">
                  <Checkbox name="approved" /> Publicar
                </label>
              </div>
              <SubmitButton size="sm">Agregar testimonio</SubmitButton>
            </ActionForm>
            <ul className="space-y-3">
              {testimonials.map((t) => (
                <li key={t.id} className="rounded-lg bg-white/3 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-fg font-medium">
                      {t.authorName} {t.isDemo && <Badge tone="warning">DEMO</Badge>}
                    </p>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Badge tone={t.approved ? "success" : "warning"}>
                        {t.approved ? "Publicado" : "Pendiente"}
                      </Badge>
                      {t.userId && <Badge tone="info">Cliente registrado</Badge>}
                      {t.verified && <Badge tone="success">Verificado</Badge>}
                    </div>
                    <ActionForm
                      action={deleteTestimonialAction}
                      confirm="¿Eliminar testimonio?"
                      successMessage={false}
                      className="space-y-0"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        aria-label="Eliminar"
                        className="text-fg-subtle hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </ActionForm>
                  </div>
                  <p className="text-warning mt-1 text-xs" aria-label={`${t.rating} de 5`}>
                    {"★".repeat(t.rating)}
                    <span className="text-fg-subtle">{"★".repeat(5 - t.rating)}</span>
                    {t.authorRole && <span className="text-fg-subtle ml-2">· {t.authorRole}</span>}
                  </p>
                  <p className="text-fg-muted mt-1">{t.content}</p>
                  <ActionForm action={saveTestimonialAction} className="mt-2 space-y-0">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="authorName" value={t.authorName} />
                    <input type="hidden" name="authorRole" value={t.authorRole ?? ""} />
                    <input type="hidden" name="content" value={t.content} />
                    <input type="hidden" name="rating" value={t.rating} />
                    {!t.approved && <input type="hidden" name="approved" value="on" />}
                    <SubmitButton size="sm" variant="ghost">
                      {t.approved ? "Ocultar del sitio" : "Publicar en el sitio"}
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
