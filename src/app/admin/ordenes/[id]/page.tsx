import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, MessageCircle, Lock, Eye } from "lucide-react";
import { AdminPageHeader, KeyValue, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";
import { ServiceStatusBadge } from "@/components/ui/status-badge";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { getQcTemplate, getBusinessSettings } from "@/services/settings";
import { SERVICE_TRANSITIONS, serviceOrderScope } from "@/services/service-orders";
import { privateUrl } from "@/lib/storage";
import { formatPEN, centsToSoles } from "@/lib/utils/money";
import { dateToLimaLocal, formatDateTime, formatDate } from "@/lib/utils/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { siteConfig } from "@/config/site";
import {
  approvalDecisionLabel,
  deviceTypeLabel,
  serviceDeliveryModeLabel,
  serviceOrderStatusLabel,
} from "@/config/statuses";
import {
  addNoteAction,
  approvalAction,
  closeAction,
  diagnosisAction,
  partAction,
  qualityAction,
  quoteAction,
  repairTaskAction,
  transitionAction,
  updateServiceOrderAction,
  uploadAttachmentsAction,
} from "@/actions/admin/service-orders";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Orden de servicio" };

const attachmentKindLabel = {
  RECEPTION_PHOTO: "Recepción",
  DIAGNOSIS_PHOTO: "Diagnóstico",
  REPAIR_PHOTO: "Reparación",
  APPROVAL_EVIDENCE: "Evidencia de aprobación",
  SHIPPING_PROOF: "Envío",
  OTHER: "Otro",
} as const;

export default async function ServiceOrderDetail({ params }: PageProps<"/admin/ordenes/[id]">) {
  const user = await requireStaffPage("service-orders:read");
  const { id } = await params;
  const order = await db.serviceOrder.findFirst({
    where: { id, ...(await serviceOrderScope(user)) },
    include: {
      customer: true,
      service: true,
      technician: { include: { user: { select: { name: true } } } },
      createdBy: { select: { name: true } },
      history: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      diagnoses: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      approvals: {
        orderBy: { createdAt: "desc" },
        include: { recordedBy: { select: { name: true } } },
      },
      repairTasks: {
        orderBy: { performedAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      parts: { orderBy: { createdAt: "desc" } },
      quality: {
        orderBy: { performedAt: "desc" },
        include: { items: true, performedBy: { select: { name: true } } },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const canWrite = hasPermission(user.role, "service-orders:write");
  const canAssign = hasPermission(user.role, "service-orders:assign");
  const closed = order.status === "DELIVERED" || order.status === "CANCELLED";
  const [services, technicians, products, qcTemplate, settings] = await Promise.all([
    db.service.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    canAssign
      ? db.technician.findMany({
          where: { active: true },
          select: { id: true, user: { select: { name: true } } },
        })
      : [],
    db.product.findMany({
      where: { deletedAt: null, status: { in: ["ACTIVE", "INACTIVE"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, stock: true, reserved: true },
    }),
    getQcTemplate(),
    getBusinessSettings(),
  ]);
  const attachments = await Promise.all(
    order.attachments.map(async (a) => ({ ...a, url: await privateUrl(a.storageKey) })),
  );
  const pendingApproval = order.approvals.find((a) => a.decision === "PENDING");
  const next = SERVICE_TRANSITIONS[order.status];
  const trackingUrl = `${siteConfig.url}/seguimiento?codigo=${order.code}`;
  const notifyMsg = `Hola ${order.customer.fullName.split(" ")[0]}, te escribimos de ELZIIUS. Tu orden ${order.code} está en estado: ${serviceOrderStatusLabel[order.status]}. Puedes consultarla en ${trackingUrl}`;
  const notifyHref = whatsappLink(notifyMsg, order.customer.phone);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/ordenes", label: "Órdenes" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.code}</span>
            <ServiceStatusBadge status={order.status} />
            {order.isDemo && <Badge tone="warning">DEMO</Badge>}
          </span>
        }
        description={`${deviceTypeLabel[order.deviceType]} ${order.brand} ${order.model ?? ""} · ${order.customer.fullName} · recibido ${formatDateTime(order.receivedAt)}`}
        actions={
          <>
            <a
              href={`/api/admin/service-orders/${order.id}/pdf`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <FileDown /> Orden PDF
            </a>
            {notifyHref && (
              <a
                href={notifyHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "whatsapp", size: "sm" })}
              >
                <MessageCircle /> Notificar al cliente
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Recepción */}
          <Panel title="Recepción" description={`Registrado por ${order.createdBy?.name ?? "—"}`}>
            <KeyValue
              cols={3}
              items={[
                [
                  "Cliente",
                  <Link
                    key="c"
                    href={`/admin/clientes/${order.customerId}`}
                    className="hover:text-brand-cyan"
                  >
                    {order.customer.fullName}
                  </Link>,
                ],
                ["Teléfono", order.customer.phone],
                ["Correo", order.customer.email],
                ["Tipo de equipo", deviceTypeLabel[order.deviceType]],
                ["Marca / modelo", `${order.brand} ${order.model ?? ""}`],
                ["N.º de serie", order.serialNumber],
                ["Accesorios", order.accessories],
                ["Servicio", order.service?.name],
                ["Técnico", order.technician?.user.name],
                ["Modalidad de entrega", serviceDeliveryModeLabel[order.deliveryMode]],
                [
                  "Fecha estimada",
                  order.estimatedReadyAt ? formatDate(order.estimatedReadyAt) : null,
                ],
                [
                  "Acceso / respaldo",
                  `${order.accessProvided ? "Acceso brindado" : "Sin acceso"} · ${order.dataBackupAuthorized ? "Respaldo autorizado" : "Sin respaldo"}`,
                ],
              ]}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-fg-subtle text-xs">Estado físico</p>
                <p className="text-fg mt-0.5 text-sm whitespace-pre-line">
                  {order.physicalCondition || "—"}
                </p>
              </div>
              <div>
                <p className="text-fg-subtle text-xs">Problema reportado</p>
                <p className="text-fg mt-0.5 text-sm whitespace-pre-line">{order.reportedIssue}</p>
              </div>
              {order.internalNotes && (
                <div className="sm:col-span-2">
                  <p className="text-warning flex items-center gap-1 text-xs">
                    <Lock className="size-3" aria-hidden /> Notas internas
                  </p>
                  <p className="text-fg-muted mt-0.5 text-sm whitespace-pre-line">
                    {order.internalNotes}
                  </p>
                </div>
              )}
            </div>
            {canWrite && !closed && (
              <details className="mt-5 rounded-xl border border-white/8 p-4">
                <summary className="text-brand-cyan cursor-pointer text-sm font-medium">
                  Editar recepción y asignación
                </summary>
                <ActionForm action={updateServiceOrderAction} className="mt-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField name="deviceType" label="Tipo">
                      <Select id="deviceType" name="deviceType" defaultValue={order.deviceType}>
                        {Object.entries(deviceTypeLabel).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField name="brand" label="Marca">
                      <Input id="brand" name="brand" defaultValue={order.brand} />
                    </FormField>
                    <FormField name="model" label="Modelo">
                      <Input id="model" name="model" defaultValue={order.model ?? ""} />
                    </FormField>
                    <FormField name="serialNumber" label="Serie">
                      <Input
                        id="serialNumber"
                        name="serialNumber"
                        defaultValue={order.serialNumber ?? ""}
                      />
                    </FormField>
                    <FormField name="accessories" label="Accesorios" className="sm:col-span-2">
                      <Input
                        id="accessories"
                        name="accessories"
                        defaultValue={order.accessories ?? ""}
                      />
                    </FormField>
                    <FormField name="serviceId" label="Servicio">
                      <Select id="serviceId" name="serviceId" defaultValue={order.serviceId ?? ""}>
                        <option value="">Por definir</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    {canAssign && (
                      <FormField name="technicianId" label="Técnico">
                        <Select
                          id="technicianId"
                          name="technicianId"
                          defaultValue={order.technicianId ?? ""}
                        >
                          <option value="">Sin asignar</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.user.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    )}
                    <FormField name="deliveryMode" label="Entrega">
                      <Select
                        id="deliveryMode"
                        name="deliveryMode"
                        defaultValue={order.deliveryMode}
                      >
                        {Object.entries(serviceDeliveryModeLabel).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField name="estimatedReadyAt" label="Fecha estimada">
                      <Input
                        id="estimatedReadyAt"
                        name="estimatedReadyAt"
                        type="date"
                        defaultValue={
                          order.estimatedReadyAt
                            ? dateToLimaLocal(order.estimatedReadyAt).slice(0, 10)
                            : ""
                        }
                      />
                    </FormField>
                  </div>
                  <FormField name="physicalCondition" label="Estado físico">
                    <Textarea
                      id="physicalCondition"
                      name="physicalCondition"
                      rows={2}
                      defaultValue={order.physicalCondition ?? ""}
                    />
                  </FormField>
                  <FormField name="reportedIssue" label="Problema reportado">
                    <Textarea
                      id="reportedIssue"
                      name="reportedIssue"
                      rows={2}
                      defaultValue={order.reportedIssue}
                    />
                  </FormField>
                  <FormField name="publicNotes" label="Observaciones públicas">
                    <Textarea
                      id="publicNotes"
                      name="publicNotes"
                      rows={2}
                      defaultValue={order.publicNotes ?? ""}
                    />
                  </FormField>
                  <FormField name="internalNotes" label="Notas internas">
                    <Textarea
                      id="internalNotes"
                      name="internalNotes"
                      rows={2}
                      defaultValue={order.internalNotes ?? ""}
                    />
                  </FormField>
                  <div className="text-fg-muted flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox name="accessProvided" defaultChecked={order.accessProvided} />{" "}
                      Acceso brindado
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        name="dataBackupAuthorized"
                        defaultChecked={order.dataBackupAuthorized}
                      />{" "}
                      Respaldo autorizado
                    </label>
                  </div>
                  <SubmitButton variant="secondary" size="sm">
                    Guardar cambios
                  </SubmitButton>
                </ActionForm>
              </details>
            )}
          </Panel>

          {/* Diagnóstico */}
          <Panel title="Diagnóstico">
            {order.diagnoses.map((d) => (
              <div key={d.id} className="mb-4 rounded-xl border border-white/8 p-4 text-sm">
                <p className="text-fg-subtle mb-2 text-xs">
                  {formatDateTime(d.createdAt)} · {d.user?.name}
                </p>
                <KeyValue
                  items={[
                    ["Fallas identificadas", d.findings],
                    ["Pruebas realizadas", d.testsPerformed],
                    ["Componentes afectados", d.affectedComponents],
                    ["Diagnóstico técnico", d.technicalDiagnosis],
                    [
                      "Presupuesto estimado",
                      d.budgetCents != null ? formatPEN(d.budgetCents) : null,
                    ],
                    ["Tiempo estimado", d.estimatedTime],
                    ["Recomendaciones", d.recommendations],
                    [
                      <span key="p" className="flex items-center gap-1">
                        <Eye className="size-3" aria-hidden /> Resumen para el cliente
                      </span>,
                      d.publicSummary,
                    ],
                  ]}
                />
              </div>
            ))}
            {canWrite &&
              ["RECEIVED", "IN_DIAGNOSIS", "QUOTE_SENT", "PENDING_APPROVAL", "IN_REPAIR"].includes(
                order.status,
              ) && (
                <details
                  open={!order.diagnoses.length}
                  className="rounded-xl border border-white/8 p-4"
                >
                  <summary className="text-brand-cyan cursor-pointer text-sm font-medium">
                    Registrar diagnóstico
                  </summary>
                  <ActionForm action={diagnosisAction} resetOnSuccess className="mt-4">
                    <input type="hidden" name="orderId" value={order.id} />
                    <FormField name="findings" label="Fallas identificadas" required>
                      <Textarea id="findings" name="findings" rows={2} />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField name="testsPerformed" label="Pruebas realizadas">
                        <Textarea id="testsPerformed" name="testsPerformed" rows={2} />
                      </FormField>
                      <FormField name="affectedComponents" label="Componentes afectados">
                        <Textarea id="affectedComponents" name="affectedComponents" rows={2} />
                      </FormField>
                    </div>
                    <FormField name="technicalDiagnosis" label="Diagnóstico técnico" required>
                      <Textarea id="technicalDiagnosis" name="technicalDiagnosis" rows={3} />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField name="budgetCents" label="Presupuesto estimado (S/)">
                        <Input id="budgetCents" name="budgetCents" inputMode="decimal" />
                      </FormField>
                      <FormField name="estimatedTime" label="Tiempo estimado">
                        <Input
                          id="estimatedTime"
                          name="estimatedTime"
                          placeholder="p.ej. 2 días hábiles"
                        />
                      </FormField>
                    </div>
                    <FormField name="recommendations" label="Recomendaciones">
                      <Textarea id="recommendations" name="recommendations" rows={2} />
                    </FormField>
                    <FormField
                      name="publicSummary"
                      label="Resumen visible para el cliente"
                      hint="Se mostrará en el seguimiento público. No incluyas datos sensibles."
                    >
                      <Textarea id="publicSummary" name="publicSummary" rows={2} />
                    </FormField>
                    <SubmitButton size="sm">Guardar diagnóstico</SubmitButton>
                  </ActionForm>
                </details>
              )}
            {!order.diagnoses.length && !canWrite && (
              <p className="text-fg-subtle text-sm">Sin diagnóstico registrado.</p>
            )}
          </Panel>

          {/* Presupuesto y aprobación */}
          <Panel
            title="Presupuesto y aprobación del cliente"
            description="No se ejecutan reparaciones sin autorización registrada."
          >
            {order.approvals.length ? (
              <ul className="mb-4 space-y-3">
                {order.approvals.map((a) => (
                  <li key={a.id} className="rounded-xl border border-white/8 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-fg font-semibold">{formatPEN(a.budgetCents)}</p>
                      <Badge
                        tone={
                          a.decision === "APPROVED"
                            ? "success"
                            : a.decision === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {approvalDecisionLabel[a.decision]}
                      </Badge>
                    </div>
                    <p className="text-fg-muted mt-1">{a.description}</p>
                    <p className="text-fg-subtle mt-2 text-xs">
                      Enviado {formatDateTime(a.sentAt)}
                      {a.sentVia ? ` vía ${a.sentVia}` : ""}
                      {a.respondedAt ? ` · Respuesta ${formatDateTime(a.respondedAt)}` : ""} ·
                      Registró {a.recordedBy?.name}
                    </p>
                    {a.evidence && (
                      <p className="text-fg-muted mt-1 text-xs">Evidencia: {a.evidence}</p>
                    )}
                    {canWrite && a.decision === "PENDING" && (
                      <ActionForm
                        action={approvalAction}
                        className="mt-4 border-t border-white/8 pt-4"
                      >
                        <input type="hidden" name="approvalId" value={a.id} />
                        <div className="grid gap-3 sm:grid-cols-[160px_1fr_200px]">
                          <FormField name="decision" label="Respuesta">
                            <Select id={`decision-${a.id}`} name="decision">
                              <option value="APPROVED">Aprobado</option>
                              <option value="REJECTED">Rechazado</option>
                            </Select>
                          </FormField>
                          <FormField name="evidence" label="Evidencia de la autorización" required>
                            <Input
                              id={`evidence-${a.id}`}
                              name="evidence"
                              placeholder="p.ej. Confirmó por WhatsApp a las 15:20"
                            />
                          </FormField>
                          <FormField name="respondedAt" label="Fecha de respuesta">
                            <Input
                              id={`respondedAt-${a.id}`}
                              name="respondedAt"
                              type="datetime-local"
                            />
                          </FormField>
                        </div>
                        <SubmitButton size="sm">Registrar respuesta</SubmitButton>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fg-subtle mb-4 text-sm">Aún no se presentó presupuesto.</p>
            )}
            {canWrite &&
              !pendingApproval &&
              ["IN_DIAGNOSIS", "IN_REPAIR", "QUOTE_SENT"].includes(order.status) &&
              order.diagnoses.length > 0 && (
                <details className="rounded-xl border border-white/8 p-4">
                  <summary className="text-brand-cyan cursor-pointer text-sm font-medium">
                    {order.status === "IN_REPAIR"
                      ? "Registrar presupuesto adicional"
                      : "Registrar presupuesto enviado"}
                  </summary>
                  <ActionForm action={quoteAction} resetOnSuccess className="mt-4">
                    <input type="hidden" name="orderId" value={order.id} />
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr_180px]">
                      <FormField name="budgetCents" label="Monto (S/)" required>
                        <Input
                          id="q-budget"
                          name="budgetCents"
                          inputMode="decimal"
                          defaultValue={
                            order.diagnoses[0]?.budgetCents != null
                              ? centsToSoles(order.diagnoses[0].budgetCents)
                              : ""
                          }
                        />
                      </FormField>
                      <FormField name="description" label="Detalle del trabajo" required>
                        <Input id="q-desc" name="description" />
                      </FormField>
                      <FormField name="sentVia" label="Enviado por">
                        <Select id="q-via" name="sentVia">
                          <option>WhatsApp</option>
                          <option>Llamada</option>
                          <option>Correo</option>
                          <option>Presencial</option>
                        </Select>
                      </FormField>
                    </div>
                    <SubmitButton size="sm">Registrar presupuesto</SubmitButton>
                  </ActionForm>
                </details>
              )}
          </Panel>

          {/* Ejecución */}
          <Panel
            title="Ejecución"
            description="Actividades realizadas, componentes reemplazados y repuestos utilizados."
          >
            {order.repairTasks.length > 0 && (
              <ul className="mb-4 space-y-2 text-sm">
                {order.repairTasks.map((t) => (
                  <li key={t.id} className="rounded-lg bg-white/3 p-3">
                    <p className="text-fg">{t.description}</p>
                    {t.notes && <p className="text-fg-muted">{t.notes}</p>}
                    <p className="text-fg-subtle mt-1 text-xs">
                      {formatDateTime(t.performedAt)} · {t.user?.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {order.parts.length > 0 && (
              <table className="mb-4 w-full text-sm">
                <thead>
                  <tr className="text-fg-subtle text-left text-xs">
                    <th className="py-1">Repuesto</th>
                    <th>Cant.</th>
                    <th>Serie</th>
                    <th>Precio</th>
                    <th>Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {order.parts.map((p) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="text-fg py-2">{p.name}</td>
                      <td>{p.quantity}</td>
                      <td className="text-fg-muted">{p.serialNumber ?? "—"}</td>
                      <td>{formatPEN(p.unitPriceCents)}</td>
                      <td className="text-fg-subtle text-xs">
                        {p.fromInventory ? "Inventario ELZIIUS" : "Externo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {canWrite && ["APPROVED", "IN_REPAIR", "IN_TESTING"].includes(order.status) ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ActionForm
                  action={repairTaskAction}
                  resetOnSuccess
                  className="rounded-xl border border-white/8 p-4"
                >
                  <p className="text-fg text-sm font-medium">Registrar actividad</p>
                  <input type="hidden" name="orderId" value={order.id} />
                  <FormField name="description" label="Actividad realizada" required>
                    <Textarea id="rt-desc" name="description" rows={2} />
                  </FormField>
                  <FormField name="notes" label="Observaciones">
                    <Input id="rt-notes" name="notes" />
                  </FormField>
                  <SubmitButton size="sm" variant="secondary">
                    Agregar actividad
                  </SubmitButton>
                </ActionForm>
                <ActionForm
                  action={partAction}
                  resetOnSuccess
                  className="rounded-xl border border-white/8 p-4"
                >
                  <p className="text-fg text-sm font-medium">Registrar repuesto</p>
                  <input type="hidden" name="orderId" value={order.id} />
                  <label className="text-fg-muted flex items-center gap-2 text-sm">
                    <Checkbox name="fromInventory" /> Descontar del inventario ELZIIUS
                  </label>
                  <FormField name="productId" label="Producto del inventario">
                    <Select id="pt-prod" name="productId">
                      <option value="">—</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) · disp. {p.stock - p.reserved}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField name="name" label="Descripción (si es externo)">
                    <Input id="pt-name" name="name" />
                  </FormField>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField name="quantity" label="Cant.">
                      <Input id="pt-qty" name="quantity" type="number" min={1} defaultValue={1} />
                    </FormField>
                    <FormField name="unitPriceCents" label="Precio (S/)">
                      <Input id="pt-price" name="unitPriceCents" inputMode="decimal" />
                    </FormField>
                    <FormField name="serialNumber" label="Serie">
                      <Input id="pt-serial" name="serialNumber" />
                    </FormField>
                  </div>
                  <SubmitButton size="sm" variant="secondary">
                    Agregar repuesto
                  </SubmitButton>
                </ActionForm>
              </div>
            ) : (
              !order.repairTasks.length && (
                <p className="text-fg-subtle text-sm">
                  La ejecución se habilita cuando el cliente aprueba el presupuesto.
                </p>
              )
            )}
          </Panel>

          {/* Control de calidad */}
          <Panel title="Control de calidad">
            {order.quality.map((q) => (
              <div key={q.id} className="mb-4 rounded-xl border border-white/8 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-fg-subtle text-xs">
                    {formatDateTime(q.performedAt)} · {q.performedBy?.name}
                  </p>
                  <Badge tone={q.passed ? "success" : "danger"}>
                    {q.passed ? "Aprobado" : "Con observaciones"}
                  </Badge>
                </div>
                <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                  {q.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="text-fg-muted">{i.label}</span>
                      <span
                        className={
                          i.result === "PASS"
                            ? "text-success"
                            : i.result === "FAIL"
                              ? "text-danger"
                              : "text-fg-subtle"
                        }
                      >
                        {i.result === "PASS" ? "OK" : i.result === "FAIL" ? "Falla" : "N/A"}
                      </span>
                    </li>
                  ))}
                </ul>
                {q.notes && <p className="text-fg-muted mt-2 text-sm">{q.notes}</p>}
              </div>
            ))}
            {canWrite && ["IN_REPAIR", "IN_TESTING"].includes(order.status) ? (
              <ActionForm action={qualityAction} className="rounded-xl border border-white/8 p-4">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="space-y-2">
                  {qcTemplate.map((label, i) => (
                    <div
                      key={label}
                      className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]"
                    >
                      <input type="hidden" name="label" value={label} />
                      <span className="text-fg text-sm">{label}</span>
                      <div
                        className="text-fg-muted flex gap-3 text-xs"
                        role="radiogroup"
                        aria-label={label}
                      >
                        {[
                          ["PASS", "OK"],
                          ["FAIL", "Falla"],
                          ["NOT_APPLICABLE", "N/A"],
                        ].map(([v, l]) => (
                          <label key={v} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`result_${i}`}
                              value={v}
                              defaultChecked={v === "PASS"}
                              className="accent-brand-cyan"
                            />{" "}
                            {l}
                          </label>
                        ))}
                      </div>
                      <Input
                        name={`notes_${i}`}
                        placeholder="Observación"
                        className="h-9"
                        aria-label={`Observación de ${label}`}
                      />
                    </div>
                  ))}
                </div>
                <FormField name="notes" label="Comentario general">
                  <Input id="qc-notes" name="notes" />
                </FormField>
                <SubmitButton size="sm">Registrar control de calidad</SubmitButton>
              </ActionForm>
            ) : (
              !order.quality.length && (
                <p className="text-fg-subtle text-sm">Se registra después de la reparación.</p>
              )
            )}
          </Panel>

          {/* Cierre */}
          {(order.status === "READY_FOR_DELIVERY" || order.status === "DELIVERED") && (
            <Panel title="Cierre y entrega">
              {order.status === "DELIVERED" ? (
                <KeyValue
                  items={[
                    ["Resultado final", order.finalResult],
                    ["Fecha de entrega", formatDateTime(order.deliveredAt)],
                    ["Garantía", order.warrantyDays ? `${order.warrantyDays} días` : null],
                    ["Condiciones de garantía", order.warrantyTerms],
                    ["Recomendaciones", order.closingRecommendations],
                    [
                      "Conformidad del cliente",
                      order.customerConformity ? "Conforme" : "No conforme",
                    ],
                    ["Observaciones de conformidad", order.conformityNotes],
                  ]}
                />
              ) : canWrite ? (
                <ActionForm
                  action={closeAction}
                  confirm="¿Confirmas la entrega del equipo al cliente? La orden quedará cerrada."
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <FormField name="finalResult" label="Resultado final" required>
                    <Textarea
                      id="finalResult"
                      name="finalResult"
                      rows={2}
                      defaultValue={order.finalResult ?? ""}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField name="warrantyDays" label="Garantía (días)">
                      <Input
                        id="warrantyDays"
                        name="warrantyDays"
                        type="number"
                        min={0}
                        defaultValue={settings.serviceWarrantyDays || ""}
                      />
                    </FormField>
                    <FormField name="deliveredAt" label="Fecha de entrega" hint="Vacío = ahora">
                      <Input id="deliveredAt" name="deliveredAt" type="datetime-local" />
                    </FormField>
                  </div>
                  <FormField name="warrantyTerms" label="Condiciones de garantía">
                    <Textarea
                      id="warrantyTerms"
                      name="warrantyTerms"
                      rows={2}
                      defaultValue={settings.warrantyText}
                    />
                  </FormField>
                  <FormField name="closingRecommendations" label="Recomendaciones al cliente">
                    <Textarea id="closingRecommendations" name="closingRecommendations" rows={2} />
                  </FormField>
                  <label className="text-fg-muted flex items-center gap-2 text-sm">
                    <Checkbox name="customerConformity" defaultChecked /> El cliente manifestó su
                    conformidad
                  </label>
                  <FormField name="conformityNotes" label="Observaciones de conformidad">
                    <Input id="conformityNotes" name="conformityNotes" />
                  </FormField>
                  <SubmitButton>Registrar entrega y cerrar orden</SubmitButton>
                </ActionForm>
              ) : null}
            </Panel>
          )}

          {/* Fotografías */}
          <Panel
            title="Fotografías y evidencias"
            description="Archivos privados: solo visibles para el personal autorizado."
          >
            {attachments.length ? (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {attachments.map((a) => (
                  <li key={a.id} className="overflow-hidden rounded-xl border border-white/8">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                      {a.mimeType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.url}
                          alt={a.fileName}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-fg-muted grid aspect-square place-items-center text-xs">
                          PDF
                        </div>
                      )}
                    </a>
                    <p className="text-fg-subtle truncate px-2 py-1.5 text-[11px]">
                      {attachmentKindLabel[a.kind]} · {formatDate(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fg-subtle mb-4 text-sm">Sin archivos adjuntos.</p>
            )}
            {canWrite && !closed && (
              <ActionForm
                action={uploadAttachmentsAction}
                resetOnSuccess
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <FormField name="kind" label="Tipo">
                  <Select id="att-kind" name="kind">
                    {Object.entries(attachmentKindLabel)
                      .filter(([k]) => k !== "SHIPPING_PROOF")
                      .map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <FormField
                  name="files"
                  label="Archivos (JPG, PNG, WEBP; PDF solo evidencias; máx. 5 MB)"
                  className="flex-1"
                >
                  <Input
                    id="att-files"
                    name="files"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="py-2"
                  />
                </FormField>
                <SubmitButton size="md" variant="secondary" pendingLabel="Subiendo…">
                  Adjuntar
                </SubmitButton>
              </ActionForm>
            )}
          </Panel>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {canWrite && next.length > 0 && (
            <Panel title="Actualizar estado">
              {pendingApproval && (
                <Alert tone="warning" className="mb-3">
                  Presupuesto pendiente de respuesta del cliente.
                </Alert>
              )}
              <ActionForm action={transitionAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <FormField name="to" label="Nuevo estado">
                  <Select id="to" name="to">
                    {next.map((s) => (
                      <option key={s} value={s}>
                        {serviceOrderStatusLabel[s]}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField name="note" label="Comentario">
                  <Textarea id="tr-note" name="note" rows={2} />
                </FormField>
                <label className="text-fg-muted flex items-center gap-2 text-sm">
                  <Checkbox name="isPublic" defaultChecked /> Visible en el seguimiento del cliente
                </label>
                <SubmitButton className="w-full">Actualizar estado</SubmitButton>
              </ActionForm>
            </Panel>
          )}
          {canWrite && !closed && (
            <Panel title="Agregar observación">
              <ActionForm action={addNoteAction} resetOnSuccess>
                <input type="hidden" name="orderId" value={order.id} />
                <FormField name="note" label="Observación" required>
                  <Textarea id="obs" name="note" rows={2} />
                </FormField>
                <label className="text-fg-muted flex items-center gap-2 text-sm">
                  <Checkbox name="isPublic" /> Compartir con el cliente
                </label>
                <SubmitButton size="sm" variant="secondary">
                  Guardar
                </SubmitButton>
              </ActionForm>
            </Panel>
          )}
          <Panel title="Historial" description="Fecha, hora y responsable de cada cambio.">
            <ol className="relative space-y-4 border-l border-white/10 pl-5">
              {order.history.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    className={cn(
                      "absolute top-1.5 -left-[25px] size-2.5 rounded-full",
                      h.isPublic ? "bg-brand-cyan" : "bg-warning",
                    )}
                    aria-hidden
                  />
                  <p className="text-fg-subtle text-xs">
                    {formatDateTime(h.createdAt)} · {h.user?.name ?? "Sistema"}{" "}
                    {!h.isPublic && <span className="text-warning">· interno</span>}
                  </p>
                  {h.toStatus && h.toStatus !== h.fromStatus && (
                    <p className="text-fg text-sm font-medium">
                      {h.fromStatus ? `${serviceOrderStatusLabel[h.fromStatus]} → ` : ""}
                      {serviceOrderStatusLabel[h.toStatus]}
                    </p>
                  )}
                  {h.note && <p className="text-fg-muted text-sm">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
