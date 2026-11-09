"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, CalendarClock, Laptop, Wrench, Truck, FileText, CheckCircle2, Circle } from "lucide-react";
import type { z } from "zod";
import { trackingLookupSchema } from "@/lib/validations/public";
import { lookupTracking } from "@/actions/public";
import type { PublicTracking } from "@/services/service-orders";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { ServiceStatusBadge } from "@/components/ui/status-badge";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { deviceTypeLabel, serviceDeliveryModeLabel, serviceOrderProgress, serviceOrderStatusLabel } from "@/config/statuses";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { formatPEN } from "@/lib/utils/money";
import { whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils/cn";

type In = z.input<typeof trackingLookupSchema>;
type Out = z.output<typeof trackingLookupSchema>;

export function TrackingLookup({ initialCode }: { initialCode?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicTracking | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<In, unknown, Out>({
    resolver: zodResolver(trackingLookupSchema),
    defaultValues: { code: initialCode ?? "", verifier: "" },
  });

  const onSubmit = (v: Out) =>
    start(async () => {
      setError(null);
      const res = await lookupTracking(v);
      if (res.ok && res.data) setData(res.data);
      else if (!res.ok) {
        setData(null);
        setError(res.error);
      }
    });

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Código de orden" htmlFor="code" error={errors.code?.message}>
          <Input id="code" placeholder="EZ-XXXX-XXXX" autoCapitalize="characters" autoComplete="off" className="font-mono uppercase" aria-invalid={!!errors.code} {...register("code")} />
        </Field>
        <Field label="Correo o teléfono registrado" htmlFor="verifier" error={errors.verifier?.message}>
          <Input id="verifier" placeholder="tucorreo@ejemplo.com o 9XXXXXXXX" autoComplete="off" aria-invalid={!!errors.verifier} {...register("verifier")} />
        </Field>
        <Button type="submit" size="lg" disabled={pending}>
          <Search /> {pending ? "Buscando…" : "Consultar"}
        </Button>
      </form>
      {error && <Alert tone="danger">{error}</Alert>}
      {data && <TrackingResult data={data} />}
    </div>
  );
}

function TrackingResult({ data }: { data: PublicTracking }) {
  const cancelled = data.status === "CANCELLED";
  const currentIndex = serviceOrderProgress.indexOf(data.status);
  return (
    <div className="space-y-6" aria-live="polite">
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-fg-muted">Hola{data.customerFirstName ? `, ${data.customerFirstName}` : ""}. Orden</p>
            <p className="font-mono text-2xl font-bold tracking-wider text-fg">{data.code}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="mb-1 text-xs text-fg-subtle">Estado actual</p>
            <ServiceStatusBadge status={data.status} />
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarClock, t: "Fecha de recepción", v: formatDate(data.receivedAt) },
            { icon: Laptop, t: "Equipo", v: `${deviceTypeLabel[data.deviceType]} · ${data.brand}${data.model ? ` ${data.model}` : ""}` },
            { icon: Wrench, t: "Servicio", v: data.serviceName ?? "Por definir tras diagnóstico" },
            { icon: Truck, t: "Modalidad de entrega", v: serviceDeliveryModeLabel[data.deliveryMode] },
          ].map(({ icon: Icon, t, v }) => (
            <div key={t} className="rounded-xl bg-white/3 p-4">
              <dt className="flex items-center gap-2 text-xs text-fg-subtle"><Icon className="size-4 text-brand-cyan" aria-hidden /> {t}</dt>
              <dd className="mt-1 font-medium text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        {data.estimatedReadyAt && !data.deliveredAt && (
          <p className="mt-4 text-sm text-fg-muted">Fecha estimada: <strong className="text-fg">{formatDate(data.estimatedReadyAt)}</strong></p>
        )}
      </div>

      {!cancelled ? (
        <div className="surface p-6">
          <h2 className="mb-6 font-semibold text-fg">Progreso</h2>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
            {serviceOrderProgress.map((s, i) => {
              const done = i < currentIndex || data.status === "DELIVERED";
              const current = i === currentIndex && data.status !== "DELIVERED";
              return (
                <li key={s} className="flex items-center gap-2 lg:flex-col lg:text-center">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border", done ? "border-success/40 bg-success/15 text-success" : current ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan shadow-[0_0_20px_-4px_rgb(0_210_255/0.8)]" : "border-white/10 text-fg-subtle")}>
                    {done ? <CheckCircle2 className="size-4" aria-hidden /> : <Circle className="size-3" aria-hidden />}
                  </span>
                  <span className={cn("text-xs", current ? "font-semibold text-brand-cyan" : done ? "text-fg" : "text-fg-subtle")}>
                    {serviceOrderStatusLabel[s]}
                    {current && <span className="sr-only"> (estado actual)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <Alert tone="danger" title="Orden cancelada">Comunícate con nosotros si tienes alguna consulta.</Alert>
      )}

      {data.pendingQuote && (
        <Alert tone="warning" title={`Presupuesto pendiente de aprobación: ${formatPEN(data.pendingQuote.budgetCents)}`}>
          {data.pendingQuote.description} — Responde por WhatsApp o llamada para continuar con el servicio.
        </Alert>
      )}

      {(data.diagnosisSummary || data.publicNotes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.diagnosisSummary && (
            <div className="surface p-6">
              <h2 className="flex items-center gap-2 font-semibold text-fg"><FileText className="size-4 text-brand-cyan" aria-hidden /> Diagnóstico</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-fg-muted">{data.diagnosisSummary}</p>
            </div>
          )}
          {data.publicNotes && (
            <div className="surface p-6">
              <h2 className="font-semibold text-fg">Observaciones</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-fg-muted">{data.publicNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="surface p-6">
        <h2 className="mb-5 font-semibold text-fg">Historial de actualizaciones</h2>
        <ol className="relative space-y-5 border-l border-white/10 pl-6">
          {data.history.map((h, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute top-1.5 -left-[29px] size-2.5 rounded-full", i === 0 ? "bg-brand-cyan" : "bg-white/25")} aria-hidden />
              <p className="text-xs text-fg-subtle">{formatDateTime(h.createdAt)}</p>
              {h.status && <p className="text-sm font-medium text-fg">{serviceOrderStatusLabel[h.status]}</p>}
              {h.note && <p className="text-sm text-fg-muted">{h.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <WhatsAppButton message={whatsappMessages.tracking(data.code)} label="Consultar por WhatsApp" />
      </div>
    </div>
  );
}
