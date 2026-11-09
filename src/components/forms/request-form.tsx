"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import type { z } from "zod";
import { publicRequestSchema } from "@/lib/validations/public";
import { submitPublicRequest } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

type In = z.input<typeof publicRequestSchema>;
type Out = z.output<typeof publicRequestSchema>;

export function RequestForm({
  kind,
  serviceSlug,
  productSlug,
  showDevice,
  showCompany,
  showSubject,
  submitLabel = "Enviar solicitud",
  defaultMessage = "",
  messageLabel = "Mensaje",
}: {
  kind: In["kind"];
  serviceSlug?: string;
  productSlug?: string;
  showDevice?: boolean;
  showCompany?: boolean;
  showSubject?: boolean;
  submitLabel?: string;
  defaultMessage?: string;
  messageLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(publicRequestSchema),
    defaultValues: {
      kind,
      serviceSlug,
      productSlug,
      message: defaultMessage,
      preferredContact: "WHATSAPP",
    },
  });

  const onSubmit = (data: Out) =>
    start(async () => {
      const res = await submitPublicRequest({ ...data, consent: true });
      if (res.ok) {
        setResult({ ok: true, message: res.message ?? "Solicitud enviada." });
        reset({ kind, serviceSlug, productSlug, message: "", preferredContact: "WHATSAPP" });
      } else {
        setResult({ ok: false, message: res.error });
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) setError(k as keyof In, { message: v[0] });
      }
    });

  if (result?.ok)
    return (
      <div className="surface flex flex-col items-center p-8 text-center">
        <CheckCircle2 className="text-success size-10" aria-hidden />
        <p className="text-fg mt-4 font-semibold">{result.message}</p>
        <Button variant="secondary" size="sm" className="mt-5" onClick={() => setResult(null)}>
          Enviar otra solicitud
        </Button>
      </div>
    );

  const id = (n: string) => `${kind}-${n}`;
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {result && !result.ok && <Alert tone="danger">{result.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" htmlFor={id("name")} error={errors.name?.message} required>
          <Input
            id={id("name")}
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </Field>
        <Field
          label="Teléfono / WhatsApp"
          htmlFor={id("phone")}
          error={errors.phone?.message}
          required
        >
          <Input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="9XX XXX XXX"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
        <Field label="Correo electrónico" htmlFor={id("email")} error={errors.email?.message}>
          <Input
            id={id("email")}
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field label="Medio de contacto preferido" htmlFor={id("pc")}>
          <Select id={id("pc")} {...register("preferredContact")}>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PHONE">Llamada</option>
            <option value="EMAIL">Correo</option>
          </Select>
        </Field>
        {showCompany && (
          <Field label="Empresa (opcional)" htmlFor={id("company")} error={errors.company?.message}>
            <Input id={id("company")} autoComplete="organization" {...register("company")} />
          </Field>
        )}
        {showDevice && (
          <Field label="Tipo de equipo" htmlFor={id("device")}>
            <Select id={id("device")} {...register("deviceType")}>
              <option value="">Selecciona…</option>
              <option>Laptop</option>
              <option>PC de escritorio</option>
              <option>All-in-One</option>
              <option>Impresora</option>
              <option>Otro</option>
            </Select>
          </Field>
        )}
        {showSubject && (
          <Field
            label="Asunto"
            htmlFor={id("subject")}
            error={errors.subject?.message}
            className="sm:col-span-2"
          >
            <Input id={id("subject")} {...register("subject")} />
          </Field>
        )}
      </div>
      <Field label={messageLabel} htmlFor={id("message")} error={errors.message?.message} required>
        <Textarea
          id={id("message")}
          rows={5}
          aria-invalid={!!errors.message}
          {...register("message")}
        />
      </Field>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
        {...register("website")}
      />
      <div>
        <label className="text-fg-muted flex items-start gap-2.5 text-sm">
          <Checkbox {...register("consent")} aria-invalid={!!errors.consent} className="mt-0.5" />
          <span>
            Autorizo el tratamiento de mis datos personales para atender esta solicitud, conforme a
            la{" "}
            <Link
              href="/legal/privacidad"
              className="text-brand-cyan hover:underline"
              target="_blank"
            >
              Política de privacidad
            </Link>{" "}
            (Ley N.º 29733).
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-danger mt-1.5 text-xs">
            {errors.consent.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto" size="lg">
        <Send /> {pending ? "Enviando…" : submitLabel}
      </Button>
    </form>
  );
}
