import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AdminPageHeader, FilterBar, Pagination, sp } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { requestKindLabel, requestStatusLabel } from "@/config/statuses";
import { requestToCustomerAction, updateRequestAction } from "@/actions/admin/management";
import type { Prisma } from "@/generated/prisma/client";
import type { RequestKind, RequestStatus } from "@/generated/prisma/enums";
import { Inbox } from "lucide-react";

export const metadata: Metadata = { title: "Solicitudes" };

export default async function RequestsPage({ searchParams }: PageProps<"/admin/solicitudes">) {
  const user = await requireStaffPage("requests:read");
  const q = await searchParams;
  const kind = sp(q.tipo);
  const status = sp(q.estado) ?? "NEW";
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.ServiceRequestWhereInput = {};
  if (kind && kind in requestKindLabel) where.kind = kind as RequestKind;
  if (status !== "todas" && status in requestStatusLabel) where.status = status as RequestStatus;
  const [total, requests] = await Promise.all([
    db.serviceRequest.count({ where }),
    db.serviceRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20, include: { service: { select: { name: true } }, product: { select: { name: true } } } }),
  ]);
  const canWrite = hasPermission(user.role, "requests:write");
  return (
    <>
      <AdminPageHeader title="Solicitudes entrantes" description="Servicios, cotizaciones, contacto, consultas de productos y libro de reclamaciones." />
      <FilterBar action="/admin/solicitudes">
        <Select name="tipo" defaultValue={kind ?? ""} className="w-56" aria-label="Tipo"><option value="">Todos los tipos</option>{Object.entries(requestKindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select name="estado" defaultValue={status} className="w-44" aria-label="Estado"><option value="todas">Todas</option>{Object.entries(requestStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </FilterBar>
      {!requests.length && <EmptyState icon={Inbox} title="Sin solicitudes" description="No hay solicitudes con esos filtros." />}
      <ul className="space-y-3">
        {requests.map((r) => {
          const wa = whatsappLink(`Hola ${r.name.split(" ")[0]}, te escribimos de ELZIIUS por tu solicitud${r.service ? ` de ${r.service.name.toLowerCase()}` : ""}.`, r.phone);
          return (
            <li key={r.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.kind === "COMPLAINT" ? "danger" : "accent"}>{requestKindLabel[r.kind]}</Badge>
                    <Badge tone={r.status === "NEW" ? "warning" : r.status === "CLOSED" ? "neutral" : "info"}>{requestStatusLabel[r.status]}</Badge>
                    <span className="text-xs text-fg-subtle">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-fg">{r.name}{r.company ? ` · ${r.company}` : ""}</p>
                  <p className="text-sm text-fg-muted">{r.phone}{r.email ? ` · ${r.email}` : ""}{r.preferredContact ? ` · prefiere ${r.preferredContact.toLowerCase()}` : ""}</p>
                  {(r.service || r.product || r.deviceType || r.subject) && <p className="mt-1 text-xs text-fg-subtle">{[r.subject, r.service?.name, r.product?.name, r.deviceType].filter(Boolean).join(" · ")}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "whatsapp", size: "sm" })}><MessageCircle /> Responder</a>}
                  {r.customerId ? (
                    <Link href={`/admin/clientes/${r.customerId}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Ver cliente</Link>
                  ) : hasPermission(user.role, "customers:write") && (
                    <ActionForm action={requestToCustomerAction} redirectPrefix="/admin/clientes/" successMessage={false} className="space-y-0">
                      <input type="hidden" name="requestId" value={r.id} />
                      <SubmitButton size="sm" variant="secondary">Crear cliente</SubmitButton>
                    </ActionForm>
                  )}
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-white/3 p-3 text-sm whitespace-pre-line text-fg-muted">{r.message}</p>
              {canWrite && (
                <ActionForm action={updateRequestAction} className="mt-3 flex flex-wrap items-end gap-2 space-y-0">
                  <input type="hidden" name="requestId" value={r.id} />
                  <Select name="status" defaultValue={r.status} className="h-9 w-40" aria-label="Estado">{Object.entries(requestStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
                  <Input name="handledNotes" defaultValue={r.handledNotes ?? ""} placeholder="Notas de atención (internas)" className="h-9 min-w-60 flex-1" aria-label="Notas de atención" />
                  <SubmitButton size="sm" variant="secondary">Guardar</SubmitButton>
                </ActionForm>
              )}
            </li>
          );
        })}
      </ul>
      <Pagination page={page} pages={Math.ceil(total / 20)} buildHref={(n) => `/admin/solicitudes?${new URLSearchParams({ ...(kind ? { tipo: kind } : {}), estado: status, pagina: String(n) })}`} />
    </>
  );
}
