"use client";
import { safeAction } from "@/lib/safe-action";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Cpu, Send } from "lucide-react";
import Link from "next/link";
import type { z } from "zod";
import { pcBuildSchema } from "@/lib/validations/public";
import { submitPcBuildQuote } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import {
  pcBudgets,
  pcCpuPrefs,
  pcExtras,
  pcGpuPrefs,
  pcRamPrefs,
  pcResolutions,
  pcStoragePrefs,
  pcTimelines,
  pcUses,
} from "@/config/pc-build";
import { cn } from "@/lib/utils/cn";

type In = z.input<typeof pcBuildSchema>;
type Out = z.output<typeof pcBuildSchema>;

function Options({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}

export function PcBuildForm({
  defaults,
}: {
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(pcBuildSchema),
    defaultValues: {
      cpu: "ANY",
      gpu: "RECOMMEND",
      ram: "RECOMMEND",
      storage: "RECOMMEND",
      resolution: "UNSURE",
      timeline: "QUOTING",
      extras: [],
      preferredContact: "WHATSAPP",
      name: defaults?.name ?? "",
      email: defaults?.email ?? "",
      phone: defaults?.phone ?? "",
    },
  });
  const use = watch("use");
  const watchedExtras = watch("extras");
  const extras: string[] = Array.isArray(watchedExtras) ? watchedExtras : [];

  const onSubmit = (data: Out) =>
    start(async () => {
      const res = await safeAction(() => submitPcBuildQuote({ ...data, consent: true }));
      if (res.ok) {
        setResult({ ok: true, message: res.message ?? "Cotización enviada." });
        reset();
      } else {
        setResult({ ok: false, message: res.error });
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) setError(k as keyof In, { message: v[0] });
      }
    });

  if (result?.ok)
    return (
      <div className="surface flex flex-col items-center p-8 text-center">
        <CheckCircle2 className="text-success size-12" aria-hidden />
        <h2 className="text-fg mt-4 text-xl font-bold">Cotización recibida</h2>
        <p className="text-fg-muted mt-2 max-w-md text-sm">{result.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
            Cotizar otra PC
          </Button>
          <Link
            href="/tienda"
            className="text-brand-cyan inline-flex items-center text-sm hover:underline"
          >
            Ver periféricos en la tienda
          </Link>
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {result && !result.ok && <Alert tone="danger">{result.message}</Alert>}

      <fieldset className="surface space-y-4 p-6">
        <legend className="text-fg flex items-center gap-2 px-1 font-semibold">
          <Cpu className="text-brand-cyan size-4" aria-hidden /> 1. ¿Para qué usarás tu PC?
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Uso principal" htmlFor="pc-use" error={errors.use?.message} required>
            <Select id="pc-use" defaultValue="" {...register("use")}>
              <option value="" disabled>
                Selecciona…
              </option>
              <Options values={pcUses} />
            </Select>
          </Field>
          <Field
            label="Presupuesto aproximado"
            htmlFor="pc-budget"
            error={errors.budget?.message}
            hint="Solo el equipo; los extras se cotizan aparte."
            required
          >
            <Select id="pc-budget" defaultValue="" {...register("budget")}>
              <option value="" disabled>
                Selecciona…
              </option>
              <Options values={pcBudgets} />
            </Select>
          </Field>
          <Field
            label={use === "GAMING" ? "¿Qué juegos quieres jugar?" : "Programas que usarás"}
            htmlFor="pc-software"
            error={errors.software?.message}
            className="sm:col-span-2"
            hint={
              use === "GAMING"
                ? "Ej.: Valorant, Fortnite, GTA V, Warzone"
                : "Ej.: Office, Photoshop, Premiere, AutoCAD, Visual Studio"
            }
          >
            <Input id="pc-software" {...register("software")} />
          </Field>
          {(use === "GAMING" || use === "DESIGN" || use === "STREAMING") && (
            <Field label="Resolución objetivo" htmlFor="pc-res">
              <Select id="pc-res" {...register("resolution")}>
                <Options values={pcResolutions} />
              </Select>
            </Field>
          )}
        </div>
      </fieldset>

      <fieldset className="surface space-y-4 p-6">
        <legend className="text-fg px-1 font-semibold">2. Preferencias de componentes</legend>
        <p className="text-fg-muted -mt-1 text-sm">
          Si no estás seguro, deja «Que me recomienden»: armamos la mejor opción para tu
          presupuesto.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Procesador" htmlFor="pc-cpu">
            <Select id="pc-cpu" {...register("cpu")}>
              <Options values={pcCpuPrefs} />
            </Select>
          </Field>
          <Field label="Tarjeta de video" htmlFor="pc-gpu">
            <Select id="pc-gpu" {...register("gpu")}>
              <Options values={pcGpuPrefs} />
            </Select>
          </Field>
          <Field label="Memoria RAM" htmlFor="pc-ram">
            <Select id="pc-ram" {...register("ram")}>
              <Options values={pcRamPrefs} />
            </Select>
          </Field>
          <Field label="Almacenamiento" htmlFor="pc-storage">
            <Select id="pc-storage" {...register("storage")}>
              <Options values={pcStoragePrefs} />
            </Select>
          </Field>
        </div>
        <div>
          <p className="text-fg mb-2 text-sm font-medium">¿Qué más incluimos en la cotización?</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(pcExtras).map(([k, v]) => {
              const on = extras.includes(k);
              return (
                <label
                  key={k}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors",
                    on
                      ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
                      : "text-fg-muted hover:text-fg border-white/10",
                  )}
                >
                  <input type="checkbox" value={k} className="sr-only" {...register("extras")} />
                  {v}
                </label>
              );
            })}
          </div>
        </div>
        <Field
          label="¿Tienes componentes que quieras reutilizar?"
          htmlFor="pc-reuse"
          hint="Ej.: gabinete, monitor, disco duro, fuente"
        >
          <Input id="pc-reuse" {...register("reuse")} />
        </Field>
        <Field label="Comentarios adicionales" htmlFor="pc-notes" error={errors.notes?.message}>
          <Textarea
            id="pc-notes"
            rows={3}
            placeholder="Colores, tamaño del gabinete, silenciosa, marcas preferidas…"
            {...register("notes")}
          />
        </Field>
      </fieldset>

      <fieldset className="surface space-y-4 p-6">
        <legend className="text-fg px-1 font-semibold">3. Tus datos de contacto</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="pc-name" error={errors.name?.message} required>
            <Input id="pc-name" autoComplete="name" {...register("name")} />
          </Field>
          <Field
            label="Celular / WhatsApp"
            htmlFor="pc-phone"
            error={errors.phone?.message}
            required
          >
            <Input id="pc-phone" type="tel" autoComplete="tel" {...register("phone")} />
          </Field>
          <Field label="Correo (opcional)" htmlFor="pc-email" error={errors.email?.message}>
            <Input id="pc-email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Ciudad / distrito" htmlFor="pc-city" hint="Para estimar el envío">
            <Input id="pc-city" {...register("city")} />
          </Field>
          <Field label="¿Cómo te contactamos?" htmlFor="pc-contact">
            <Select id="pc-contact" {...register("preferredContact")}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Llamada</option>
              <option value="EMAIL">Correo</option>
            </Select>
          </Field>
          <Field label="¿Para cuándo la necesitas?" htmlFor="pc-timeline">
            <Select id="pc-timeline" {...register("timeline")}>
              <Options values={pcTimelines} />
            </Select>
          </Field>
        </div>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          {...register("website")}
        />
        <label className="text-fg-muted flex items-start gap-2.5 text-sm">
          <Checkbox className="mt-0.5" {...register("consent")} />
          <span>
            Acepto la{" "}
            <Link href="/legal/privacidad" className="text-brand-cyan hover:underline">
              política de privacidad
            </Link>{" "}
            y que ELZIIUS me contacte para enviarme esta cotización.
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-danger -mt-2 text-xs">
            {errors.consent.message}
          </p>
        )}
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        <Send aria-hidden /> {pending ? "Enviando…" : "Solicitar cotización"}
      </Button>
    </form>
  );
}
