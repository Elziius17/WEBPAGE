import { ActionForm, FormField, SubmitButton } from "./action-form";
import { KeyValue, Panel } from "./ui";
import { Input, Select, Textarea } from "@/components/ui/form";
import { DeliveryStatusBadge } from "@/components/ui/status-badge";
import { deliveryStatusLabel } from "@/config/statuses";
import { allowedDeliveryTransitions } from "@/services/orders";
import { centsToSoles, formatPEN } from "@/lib/utils/money";
import { dateToLimaLocal, formatDateTime } from "@/lib/utils/dates";
import {
  deliveryStatusAction,
  updateDeliveryAction,
  uploadShippingProofAction,
} from "@/actions/admin/commerce";
import type { Prisma } from "@/generated/prisma/client";

export type DeliveryFull = Prisma.DeliveryGetPayload<{
  include: {
    address: true;
    courier: true;
    zone: true;
    tracking: { include: { createdBy: { select: { name: true } } } };
    attachments: true;
  };
}>;

export function DeliveryPanel({
  delivery,
  couriers,
  zones,
  canWrite,
}: {
  delivery: DeliveryFull;
  couriers: { id: string; name: string }[];
  zones: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const next = allowedDeliveryTransitions(delivery.method, delivery.status);
  const closed = delivery.status === "DELIVERED" || delivery.status === "CANCELLED";
  const a = delivery.address;
  const trackingUrl =
    delivery.courier?.trackingUrlTemplate && delivery.trackingNumber
      ? delivery.courier.trackingUrlTemplate.replace(
          "{code}",
          encodeURIComponent(delivery.trackingNumber),
        )
      : null;
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          Entrega · {delivery.method === "PICKUP" ? "Recojo presencial" : "Envío por courier"}{" "}
          <DeliveryStatusBadge status={delivery.status} />
        </span>
      }
    >
      <KeyValue
        cols={3}
        items={[
          ["Recibe", `${delivery.recipientName} · ${delivery.recipientPhone}`],
          ...(delivery.method === "COURIER"
            ? ([
                [
                  "Dirección",
                  a
                    ? `${a.line1}${a.line2 ? `, ${a.line2}` : ""} — ${a.district}, ${a.province}, ${a.department}${a.reference ? ` (Ref: ${a.reference})` : ""}`
                    : null,
                ],
                ["Zona", delivery.zone?.name],
                ["Courier", delivery.courier?.name],
                [
                  "N.º de guía",
                  trackingUrl ? (
                    <a
                      key="t"
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline"
                    >
                      {delivery.trackingNumber}
                    </a>
                  ) : (
                    delivery.trackingNumber
                  ),
                ],
                [
                  "Peso / dimensiones",
                  [
                    delivery.weightGrams && `${delivery.weightGrams} g`,
                    delivery.lengthCm &&
                      `${delivery.lengthCm}×${delivery.widthCm ?? "?"}×${delivery.heightCm ?? "?"} cm`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || null,
                ],
                [
                  "Fecha de despacho",
                  delivery.dispatchedAt ? formatDateTime(delivery.dispatchedAt) : null,
                ],
              ] as [string, React.ReactNode][])
            : ([
                ["Lugar de recojo", delivery.pickupLocation],
                [
                  "Fecha y hora coordinada",
                  delivery.scheduledAt ? formatDateTime(delivery.scheduledAt) : null,
                ],
              ] as [string, React.ReactNode][])),
          [
            "Costo de envío",
            delivery.costCents != null
              ? formatPEN(delivery.costCents)
              : delivery.method === "PICKUP"
                ? "Sin costo"
                : "Por cotizar",
          ],
          [
            "Entregado",
            delivery.deliveredAt
              ? `${formatDateTime(delivery.deliveredAt)}${delivery.receivedBy ? ` · recibió ${delivery.receivedBy}` : ""}`
              : null,
          ],
          ["Incidencia", delivery.incidentNotes],
        ]}
      />

      {canWrite && !closed && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ActionForm
            action={updateDeliveryAction}
            className="rounded-xl border border-white/8 p-4"
          >
            <p className="text-fg text-sm font-medium">Datos de la entrega</p>
            <input type="hidden" name="deliveryId" value={delivery.id} />
            {delivery.method === "COURIER" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="courierId" label="Courier">
                    <Select id="d-courier" name="courierId" defaultValue={delivery.courierId ?? ""}>
                      <option value="">—</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField name="zoneId" label="Zona">
                    <Select id="d-zone" name="zoneId" defaultValue={delivery.zoneId ?? ""}>
                      <option value="">—</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField name="trackingNumber" label="N.º de guía">
                    <Input
                      id="d-track"
                      name="trackingNumber"
                      defaultValue={delivery.trackingNumber ?? ""}
                    />
                  </FormField>
                  <FormField
                    name="costCents"
                    label="Costo de envío (S/)"
                    hint="Actualiza el total del pedido"
                  >
                    <Input
                      id="d-cost"
                      name="costCents"
                      inputMode="decimal"
                      defaultValue={centsToSoles(delivery.costCents)}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <FormField name="weightGrams" label="Peso (g)">
                    <Input
                      id="d-w"
                      name="weightGrams"
                      type="number"
                      min={0}
                      defaultValue={delivery.weightGrams ?? ""}
                    />
                  </FormField>
                  <FormField name="lengthCm" label="Largo">
                    <Input
                      id="d-l"
                      name="lengthCm"
                      type="number"
                      min={0}
                      defaultValue={delivery.lengthCm ?? ""}
                    />
                  </FormField>
                  <FormField name="widthCm" label="Ancho">
                    <Input
                      id="d-wi"
                      name="widthCm"
                      type="number"
                      min={0}
                      defaultValue={delivery.widthCm ?? ""}
                    />
                  </FormField>
                  <FormField name="heightCm" label="Alto">
                    <Input
                      id="d-h"
                      name="heightCm"
                      type="number"
                      min={0}
                      defaultValue={delivery.heightCm ?? ""}
                    />
                  </FormField>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FormField name="pickupLocation" label="Lugar de recojo">
                  <Input
                    id="d-loc"
                    name="pickupLocation"
                    defaultValue={delivery.pickupLocation ?? ""}
                  />
                </FormField>
                <FormField name="scheduledAt" label="Fecha y hora">
                  <Input
                    id="d-sch"
                    name="scheduledAt"
                    type="datetime-local"
                    defaultValue={dateToLimaLocal(delivery.scheduledAt)}
                  />
                </FormField>
              </div>
            )}
            <FormField name="receivedBy" label="Recibido por">
              <Input id="d-rec" name="receivedBy" defaultValue={delivery.receivedBy ?? ""} />
            </FormField>
            <FormField name="notes" label="Notas">
              <Textarea id="d-notes" name="notes" rows={2} defaultValue={delivery.notes ?? ""} />
            </FormField>
            <SubmitButton size="sm" variant="secondary">
              Guardar datos
            </SubmitButton>
          </ActionForm>
          <div className="space-y-5">
            {next.length > 0 && (
              <ActionForm
                action={deliveryStatusAction}
                className="rounded-xl border border-white/8 p-4"
              >
                <p className="text-fg text-sm font-medium">Actualizar estado</p>
                <input type="hidden" name="deliveryId" value={delivery.id} />
                <FormField name="to" label="Nuevo estado">
                  <Select id="d-to" name="to">
                    {next.map((s) => (
                      <option key={s} value={s}>
                        {deliveryStatusLabel[s]}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="description" label="Detalle / incidencia">
                    <Input id="d-desc" name="description" />
                  </FormField>
                  <FormField name="location" label="Ubicación">
                    <Input id="d-locn" name="location" />
                  </FormField>
                </div>
                <SubmitButton size="sm">Actualizar entrega</SubmitButton>
              </ActionForm>
            )}
            <ActionForm
              action={uploadShippingProofAction}
              resetOnSuccess
              className="rounded-xl border border-white/8 p-4"
            >
              <p className="text-fg text-sm font-medium">Comprobante de envío / entrega</p>
              <input type="hidden" name="deliveryId" value={delivery.id} />
              <FormField name="file" label="Archivo (imagen o PDF, máx. 5 MB)">
                <Input
                  id="d-file"
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="py-2"
                />
              </FormField>
              <SubmitButton size="sm" variant="secondary" pendingLabel="Subiendo…">
                Adjuntar
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      )}

      {delivery.attachments.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs">
          {delivery.attachments.map((f) => (
            <li key={f.id}>
              <a
                href={`/api/files/${f.storageKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan rounded-lg border border-white/10 px-2.5 py-1 hover:underline"
              >
                {f.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <p className="text-fg-subtle mb-2 text-xs font-medium">Seguimiento del envío</p>
        <ol className="space-y-2 border-l border-white/10 pl-4 text-sm">
          {delivery.tracking.map((t) => (
            <li key={t.id}>
              <span className="text-fg">{deliveryStatusLabel[t.status]}</span>
              {t.description && <span className="text-fg-muted"> · {t.description}</span>}
              {t.location && <span className="text-fg-muted"> · {t.location}</span>}
              <p className="text-fg-subtle text-xs">
                {formatDateTime(t.occurredAt)} · {t.createdBy?.name ?? "Sistema"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
