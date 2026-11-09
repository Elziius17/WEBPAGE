"use client";
import { useState } from "react";
import { ActionForm, FormField, SubmitButton } from "./action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { deviceTypeLabel, serviceDeliveryModeLabel } from "@/config/statuses";
import { createServiceOrderAction } from "@/actions/admin/service-orders";

type Opt = { id: string; label: string };

export function ReceptionForm({
  customers,
  services,
  technicians,
  canAssign,
  presetCustomerId,
}: {
  customers: Opt[];
  services: Opt[];
  technicians: Opt[];
  canAssign: boolean;
  presetCustomerId?: string;
}) {
  const [mode, setMode] = useState<"existing" | "new">(
    presetCustomerId ? "existing" : customers.length ? "existing" : "new",
  );
  return (
    <ActionForm
      action={createServiceOrderAction}
      redirectTo={(d) => `/admin/ordenes/${(d as { id: string }).id}`}
      className="space-y-6"
    >
      <section className="surface space-y-4 p-6">
        <h2 className="text-fg font-semibold">Cliente</h2>
        <div className="flex gap-2" role="radiogroup" aria-label="Tipo de cliente">
          {(["existing", "new"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${mode === m ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : "text-fg-muted border-white/10"}`}
            >
              {m === "existing" ? "Cliente registrado" : "Nuevo cliente"}
            </button>
          ))}
        </div>
        {mode === "existing" ? (
          <FormField name="customerId" label="Seleccionar cliente" required>
            <Select
              id="customerId"
              name="customerId"
              defaultValue={presetCustomerId ?? ""}
              required
            >
              <option value="">Selecciona…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="customerName" label="Nombre completo" required>
              <Input id="customerName" name="customerName" />
            </FormField>
            <FormField name="customerPhone" label="Teléfono" required>
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </FormField>
            <FormField name="customerEmail" label="Correo">
              <Input id="customerEmail" name="customerEmail" type="email" />
            </FormField>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <FormField name="documentType" label="Doc.">
                <Select id="documentType" name="documentType">
                  <option value="">—</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">C.E.</option>
                  <option value="PASSPORT">Pasaporte</option>
                </Select>
              </FormField>
              <FormField name="documentNumber" label="Número">
                <Input id="documentNumber" name="documentNumber" />
              </FormField>
            </div>
          </div>
        )}
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="text-fg font-semibold">Equipo</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField name="deviceType" label="Tipo de equipo" required>
            <Select id="deviceType" name="deviceType" defaultValue="LAPTOP">
              {Object.entries(deviceTypeLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField name="brand" label="Marca" required>
            <Input id="brand" name="brand" />
          </FormField>
          <FormField name="model" label="Modelo">
            <Input id="model" name="model" />
          </FormField>
          <FormField name="serialNumber" label="Número de serie">
            <Input id="serialNumber" name="serialNumber" />
          </FormField>
          <FormField name="accessories" label="Accesorios recibidos" className="sm:col-span-2">
            <Input id="accessories" name="accessories" placeholder="Cargador, maletín, mouse…" />
          </FormField>
        </div>
        <FormField name="physicalCondition" label="Estado físico">
          <Textarea
            id="physicalCondition"
            name="physicalCondition"
            rows={2}
            placeholder="Rayones en tapa, bisagra floja…"
          />
        </FormField>
        <FormField name="reportedIssue" label="Problema reportado" required>
          <Textarea id="reportedIssue" name="reportedIssue" rows={3} />
        </FormField>
        <div className="text-fg-muted flex flex-col gap-2.5 text-sm">
          <label className="flex items-center gap-2.5">
            <Checkbox name="accessProvided" /> El cliente brindó acceso al sistema (la contraseña NO
            se registra en la plataforma)
          </label>
          <label className="flex items-center gap-2.5">
            <Checkbox name="dataBackupAuthorized" /> El cliente autoriza respaldo de información
          </label>
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="text-fg font-semibold">Servicio y asignación</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField name="serviceId" label="Servicio solicitado">
            <Select id="serviceId" name="serviceId">
              <option value="">Por definir</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FormField>
          {canAssign && (
            <FormField name="technicianId" label="Técnico asignado">
              <Select id="technicianId" name="technicianId">
                <option value="">Sin asignar</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          <FormField name="deliveryMode" label="Modalidad de entrega">
            <Select id="deliveryMode" name="deliveryMode">
              {Object.entries(serviceDeliveryModeLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField name="estimatedReadyAt" label="Fecha estimada">
            <Input id="estimatedReadyAt" name="estimatedReadyAt" type="date" />
          </FormField>
          <FormField name="receivedAt" label="Fecha y hora de ingreso" hint="Vacío = ahora">
            <Input id="receivedAt" name="receivedAt" type="datetime-local" />
          </FormField>
        </div>
        <FormField name="publicNotes" label="Observaciones visibles para el cliente">
          <Textarea id="publicNotes" name="publicNotes" rows={2} />
        </FormField>
        <FormField name="internalNotes" label="Notas internas (no visibles al cliente)">
          <Textarea id="internalNotes" name="internalNotes" rows={2} />
        </FormField>
      </section>
      <SubmitButton size="lg">Registrar recepción y generar orden</SubmitButton>
    </ActionForm>
  );
}
