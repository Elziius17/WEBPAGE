"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Clock, Star } from "lucide-react";
import type { z } from "zod";
import { customerTestimonialSchema } from "@/lib/validations/public";
import { deleteOwnTestimonialAction, submitTestimonialAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";

type In = z.input<typeof customerTestimonialSchema>;
type Out = z.output<typeof customerTestimonialSchema>;

export type OwnTestimonial = {
  authorName: string;
  authorRole: string | null;
  content: string;
  rating: number;
  approved: boolean;
  verified: boolean;
};

export function TestimonialForm({
  existing,
  suggestedName,
}: {
  existing: OwnTestimonial | null;
  suggestedName: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState<"none" | "pending" | "published">(
    existing ? (existing.approved ? "published" : "pending") : "none",
  );
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(customerTestimonialSchema),
    defaultValues: {
      authorName: existing?.authorName ?? suggestedName,
      authorRole: existing?.authorRole ?? "",
      content: existing?.content ?? "",
      rating: existing?.rating ?? 5,
      consent: false,
    },
  });
  const rating = Number(watch("rating") ?? 0);
  const content = String(watch("content") ?? "");

  const onSubmit = (d: Out) =>
    start(async () => {
      setResult(null);
      const r = await submitTestimonialAction(d);
      if (r.ok) {
        setStatus("pending");
        setValue("consent", false);
      }
      setResult({ ok: r.ok, text: r.ok ? (r.message ?? "Guardado.") : r.error });
    });

  const onDelete = () => {
    if (!confirm("¿Eliminar tu opinión? Dejará de mostrarse en la página.")) return;
    start(async () => {
      const r = await deleteOwnTestimonialAction();
      if (r.ok) {
        setStatus("none");
        reset({
          authorName: suggestedName,
          authorRole: "",
          content: "",
          rating: 5,
          consent: false,
        });
      }
      setResult({ ok: r.ok, text: r.ok ? (r.message ?? "Eliminado.") : r.error });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface space-y-5 p-6">
      {status !== "none" && (
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            status === "published" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
          )}
        >
          {status === "published" ? (
            <>
              <BadgeCheck className="size-3.5" aria-hidden /> Publicada en la página de inicio
            </>
          ) : (
            <>
              <Clock className="size-3.5" aria-hidden /> Pendiente de revisión
            </>
          )}
        </p>
      )}
      {result && <Alert tone={result.ok ? "success" : "danger"}>{result.text}</Alert>}

      <fieldset>
        <legend className="text-fg mb-2 text-sm font-medium">
          Valoración <span className="text-danger">*</span>
        </legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Valoración de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" title={`${n} de 5`}>
              <input
                type="radio"
                value={n}
                className="peer sr-only"
                {...register("rating")}
                aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              />
              <Star
                aria-hidden
                className={cn(
                  "peer-focus-visible:ring-brand-cyan size-8 rounded transition-colors peer-focus-visible:ring-2",
                  n <= rating ? "fill-warning text-warning" : "text-fg-subtle",
                )}
              />
            </label>
          ))}
        </div>
        {errors.rating && (
          <p role="alert" className="text-danger mt-1 text-xs">
            {errors.rating.message}
          </p>
        )}
      </fieldset>

      <Field
        label="Tu opinión"
        htmlFor="t-content"
        error={errors.content?.message}
        hint={`${content.length}/600 · ¿Qué servicio o producto recibiste y cómo fue la experiencia?`}
        required
      >
        <Textarea id="t-content" rows={4} maxLength={600} {...register("content")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre a mostrar"
          htmlFor="t-name"
          error={errors.authorName?.message}
          hint="Puedes usar solo tu nombre e inicial, p. ej. «Carlos M.»"
          required
        >
          <Input id="t-name" {...register("authorName")} />
        </Field>
        <Field
          label="Referencia (opcional)"
          htmlFor="t-role"
          error={errors.authorRole?.message}
          hint="P. ej. «Mantenimiento de laptop» o tu distrito"
        >
          <Input id="t-role" {...register("authorRole")} />
        </Field>
      </div>

      <label className="text-fg-muted flex items-start gap-2.5 text-sm">
        <Checkbox className="mt-0.5" {...register("consent")} />
        <span>
          Autorizo a ELZIIUS a publicar mi opinión, valoración y el nombre que indiqué en su sitio
          web. Puedo editarla o eliminarla cuando quiera desde esta página.
        </span>
      </label>
      {errors.consent && (
        <p role="alert" className="text-danger -mt-3 text-xs">
          {errors.consent.message}
        </p>
      )}

      <p className="text-fg-subtle text-xs">
        Revisamos cada opinión antes de publicarla. Si la editas, volverá a revisión.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : status === "none" ? "Enviar mi opinión" : "Actualizar opinión"}
        </Button>
        {status !== "none" && (
          <Button type="button" variant="ghost" disabled={pending} onClick={onDelete}>
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}
