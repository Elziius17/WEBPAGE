"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import type { z } from "zod";
import { complaintSchema } from "@/lib/validations/public";
import { submitComplaint } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils/dates";

type In = z.input<typeof complaintSchema>;
type Out = z.output<typeof complaintSchema>;

export function ComplaintForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; createdAt: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { type: "RECLAMO", documentType: "DNI", goodType: "PRODUCTO" },
  });

  if (done)
    return (
      <div className="surface p-8 text-center">
        <CheckCircle2 className="text-success mx-auto size-12" aria-hidden />
        <h2 className="text-fg mt-4 text-xl font-bold">Hoja de reclamación registrada</h2>
        <p className="text-brand-cyan mt-2 font-mono text-2xl font-bold">{done.code}</p>
        <p className="text-fg-muted mt-2 text-sm">
          Fecha de registro: {formatDateTime(done.createdAt)}
        </p>
        <p className="text-fg-muted mt-4 text-sm">
          Guarda este código. Te responderemos al correo indicado dentro del plazo legal.
        </p>
      </div>
    );

  const onSubmit = (d: Out) =>
    start(async () => {
      setError(null);
      const r = await submitComplaint({ ...d, consent: true });
      if (r.ok && r.data) setDone(r.data);
      else if (!r.ok) setError(r.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {error && <Alert tone="danger">{error}</Alert>}
      <fieldset className="space-y-4">
        <legend className="text-fg mb-2 font-semibold">
          1. Identificación del consumidor reclamante
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="c-name" error={errors.name?.message} required>
            <Input id="c-name" {...register("name")} />
          </Field>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <Field label="Documento" htmlFor="c-dt">
              <Select id="c-dt" {...register("documentType")}>
                <option value="DNI">DNI</option>
                <option value="CE">C.E.</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="RUC">RUC</option>
              </Select>
            </Field>
            <Field label="Número" htmlFor="c-dn" error={errors.documentNumber?.message} required>
              <Input id="c-dn" {...register("documentNumber")} />
            </Field>
          </div>
          <Field
            label="Domicilio"
            htmlFor="c-addr"
            error={errors.address?.message}
            required
            className="sm:col-span-2"
          >
            <Input id="c-addr" {...register("address")} />
          </Field>
          <Field label="Teléfono" htmlFor="c-phone" error={errors.phone?.message} required>
            <Input id="c-phone" type="tel" {...register("phone")} />
          </Field>
          <Field
            label="Correo electrónico"
            htmlFor="c-email"
            error={errors.email?.message}
            required
          >
            <Input id="c-email" type="email" {...register("email")} />
          </Field>
          <Field
            label="Padre, madre o apoderado (si eres menor de edad)"
            htmlFor="c-g"
            className="sm:col-span-2"
          >
            <Input id="c-g" {...register("guardian")} />
          </Field>
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-fg mb-2 font-semibold">
          2. Identificación del bien contratado
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tipo" htmlFor="c-gt">
            <Select id="c-gt" {...register("goodType")}>
              <option value="PRODUCTO">Producto</option>
              <option value="SERVICIO">Servicio</option>
            </Select>
          </Field>
          <Field label="Monto reclamado (S/)" htmlFor="c-amt">
            <Input id="c-amt" inputMode="decimal" {...register("amount")} />
          </Field>
          <Field
            label="Descripción"
            htmlFor="c-gd"
            error={errors.goodDescription?.message}
            required
            className="sm:col-span-3"
          >
            <Input id="c-gd" {...register("goodDescription")} />
          </Field>
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-fg mb-2 font-semibold">
          3. Detalle de la reclamación y pedido del consumidor
        </legend>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="surface flex flex-1 cursor-pointer gap-3 p-4 text-sm">
            <input
              type="radio"
              value="RECLAMO"
              className="accent-brand-cyan mt-0.5"
              {...register("type")}
            />
            <span>
              <strong className="text-fg">Reclamo:</strong>{" "}
              <span className="text-fg-muted">
                disconformidad relacionada a los productos o servicios.
              </span>
            </span>
          </label>
          <label className="surface flex flex-1 cursor-pointer gap-3 p-4 text-sm">
            <input
              type="radio"
              value="QUEJA"
              className="accent-brand-cyan mt-0.5"
              {...register("type")}
            />
            <span>
              <strong className="text-fg">Queja:</strong>{" "}
              <span className="text-fg-muted">
                disconformidad no relacionada a los productos o servicios, o malestar respecto a la
                atención.
              </span>
            </span>
          </label>
        </div>
        <Field label="Detalle" htmlFor="c-detail" error={errors.detail?.message} required>
          <Textarea id="c-detail" rows={5} {...register("detail")} />
        </Field>
        <Field label="Pedido" htmlFor="c-req" error={errors.request?.message} required>
          <Textarea id="c-req" rows={3} {...register("request")} />
        </Field>
      </fieldset>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
        {...register("website")}
      />
      <label className="text-fg-muted flex items-start gap-2.5 text-sm">
        <Checkbox className="mt-0.5" {...register("consent")} />
        <span>
          Declaro que los datos consignados son verdaderos y autorizo su tratamiento para la
          atención de esta hoja de reclamación.
        </span>
      </label>
      {errors.consent && (
        <p role="alert" className="text-danger text-xs">
          {errors.consent.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar hoja de reclamación"}
      </Button>
    </form>
  );
}
