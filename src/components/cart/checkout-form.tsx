"use client";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2, Store, Truck, ShoppingCart } from "lucide-react";
import type { z } from "zod";
import { checkoutFormSchema } from "@/lib/validations/checkout";
import { placeOrder } from "@/actions/public";
import { useCartSnapshot } from "@/hooks/use-cart-snapshot";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { formatPEN } from "@/lib/utils/money";
import { whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils/cn";

type In = z.input<typeof checkoutFormSchema>;
type Out = z.output<typeof checkoutFormSchema>;
type Zone = {
  id: string;
  name: string;
  description: string | null;
  baseCostCents: number | null;
  costIsMinimum: boolean;
  estimatedTime: string | null;
};

export function CheckoutForm({
  zones,
  defaults,
  pickupInstructions,
}: {
  zones: Zone[];
  defaults: { name?: string; email?: string; phone?: string };
  pickupInstructions?: string;
}) {
  const { cart, rows, loading, subtotal, problems } = useCartSnapshot();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; totalCents: number } | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    control,
    setError: setFieldError,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryMethod: "PICKUP",
      contactName: defaults.name ?? "",
      contactEmail: defaults.email ?? "",
      contactPhone: defaults.phone ?? "",
    },
  });
  const method = useWatch({ control, name: "deliveryMethod" });
  const zoneId = useWatch({ control, name: "zoneId" });
  const zone = zones.find((z) => z.id === zoneId);
  // Un costo "desde" es solo referencial: el flete real se cotiza y no se suma al total.
  const shipping =
    method === "PICKUP" ? 0 : zone && !zone.costIsMinimum ? (zone.baseCostCents ?? null) : null;
  const shippingFrom =
    method === "COURIER" && zone?.costIsMinimum ? (zone.baseCostCents ?? null) : null;

  if (done)
    return (
      <div className="surface mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="text-success mx-auto size-12" aria-hidden />
        <h2 className="text-fg mt-4 text-2xl font-bold">¡Pedido registrado!</h2>
        <p className="text-fg-muted mt-2">Tu código de pedido es</p>
        <p className="font-display text-brand-cyan mt-1 text-3xl font-extrabold tracking-wider">
          {done.code}
        </p>
        <p className="text-fg-muted mt-4 text-sm">
          Total registrado: <strong className="text-fg">{formatPEN(done.totalCents)}</strong>
          {method === "COURIER" && shipping === null && " + envío por cotizar"}
        </p>
        <Alert tone="info" className="mt-6 text-left">
          Verificaremos la disponibilidad y te contactaremos para coordinar el pago y la entrega.
          <strong className="text-fg"> Aún no se ha realizado ningún cobro.</strong>
        </Alert>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <WhatsAppButton
            message={whatsappMessages.order(done.code, formatPEN(done.totalCents))}
            label="Coordinar por WhatsApp"
          />
          <ButtonLink href="/tienda" variant="secondary">
            Seguir comprando
          </ButtonLink>
        </div>
      </div>
    );

  if (loading) return <div className="surface h-96 animate-pulse" aria-busy="true" />;
  if (!rows.length)
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Tu carrito está vacío"
        action={<ButtonLink href="/tienda">Ir a la tienda</ButtonLink>}
      />
    );

  const onSubmit = (data: Out) =>
    start(async () => {
      setError(null);
      const res = await placeOrder({
        ...data,
        idempotencyKey,
        consent: true,
        items: rows.map((r) => ({ productId: r.id, quantity: r.quantity })),
      });
      if (res.ok && res.data) {
        setDone(res.data);
        cart.clear();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (!res.ok) {
        setError(res.error);
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) setFieldError(k as keyof In, { message: v[0] });
      }
    });

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        setError("Revisa los campos marcados en el formulario."),
      )}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-8">
        {error && <Alert tone="danger">{error}</Alert>}
        <fieldset className="surface space-y-4 p-6">
          <legend className="sr-only">Datos del comprador</legend>
          <h2 className="text-fg text-lg font-semibold">1. Datos del comprador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre completo"
              htmlFor="contactName"
              error={errors.contactName?.message}
              required
            >
              <Input
                id="contactName"
                autoComplete="name"
                aria-invalid={!!errors.contactName}
                {...register("contactName")}
              />
            </Field>
            <Field
              label="Teléfono / WhatsApp"
              htmlFor="contactPhone"
              error={errors.contactPhone?.message}
              required
            >
              <Input
                id="contactPhone"
                type="tel"
                autoComplete="tel"
                aria-invalid={!!errors.contactPhone}
                {...register("contactPhone")}
              />
            </Field>
            <Field
              label="Correo electrónico"
              htmlFor="contactEmail"
              error={errors.contactEmail?.message}
            >
              <Input
                id="contactEmail"
                type="email"
                autoComplete="email"
                {...register("contactEmail")}
              />
            </Field>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <Field label="Documento" htmlFor="documentType">
                <Select id="documentType" {...register("documentType")}>
                  <option value="">—</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">C.E.</option>
                  <option value="PASSPORT">Pasaporte</option>
                </Select>
              </Field>
              <Field
                label="Número"
                htmlFor="documentNumber"
                error={errors.documentNumber?.message}
                hint="Para boleta o factura"
              >
                <Input id="documentNumber" inputMode="numeric" {...register("documentNumber")} />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="surface space-y-4 p-6">
          <legend className="sr-only">Modalidad de entrega</legend>
          <h2 className="text-fg text-lg font-semibold">2. Modalidad de entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                v: "PICKUP",
                icon: Store,
                t: "Recojo presencial",
                d: "Coordinamos lugar y horario contigo.",
              },
              {
                v: "COURIER",
                icon: Truck,
                t: "Envío por courier",
                d: "Enviamos a tu dirección. Costo según destino.",
              },
            ].map(({ v, icon: Icon, t, d }) => (
              <label
                key={v}
                className={cn(
                  "surface flex cursor-pointer gap-3 p-4 transition-colors",
                  method === v && "border-brand-cyan/50 bg-brand-cyan/5",
                )}
              >
                <input
                  type="radio"
                  value={v}
                  className="accent-brand-cyan mt-1"
                  {...register("deliveryMethod")}
                />
                <span>
                  <span className="text-fg flex items-center gap-2 font-semibold">
                    <Icon className="text-brand-cyan size-4" aria-hidden /> {t}
                  </span>
                  <span className="text-fg-muted mt-0.5 block text-sm">{d}</span>
                </span>
              </label>
            ))}
          </div>
          {method === "PICKUP" && pickupInstructions && (
            <Alert tone="info">{pickupInstructions}</Alert>
          )}
          {method === "COURIER" && (
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              {zones.length > 0 && (
                <Field
                  label="Zona de envío"
                  htmlFor="zoneId"
                  className="sm:col-span-2"
                  hint={
                    zone?.estimatedTime
                      ? `Tiempo estimado: ${zone.estimatedTime}`
                      : (zone?.description ?? undefined)
                  }
                >
                  <Select id="zoneId" {...register("zoneId")}>
                    <option value="">Selecciona tu zona (o déjala para cotizar)</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                        {z.baseCostCents != null
                          ? ` — ${z.costIsMinimum ? "desde " : ""}${formatPEN(z.baseCostCents)}`
                          : " — por cotizar"}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field
                label="Nombre de quien recibe"
                htmlFor="recipientName"
                hint="Si es distinto al comprador"
              >
                <Input id="recipientName" {...register("recipientName")} />
              </Field>
              <Field label="Dirección" htmlFor="line1" error={errors.line1?.message} required>
                <Input
                  id="line1"
                  autoComplete="address-line1"
                  placeholder="Av./Jr./Calle, número"
                  {...register("line1")}
                />
              </Field>
              <Field label="Departamento / interior (opcional)" htmlFor="line2">
                <Input id="line2" autoComplete="address-line2" {...register("line2")} />
              </Field>
              <Field label="Distrito" htmlFor="district" error={errors.district?.message} required>
                <Input id="district" {...register("district")} />
              </Field>
              <Field label="Provincia" htmlFor="province" error={errors.province?.message} required>
                <Input id="province" {...register("province")} />
              </Field>
              <Field
                label="Departamento (región)"
                htmlFor="department"
                error={errors.department?.message}
                required
              >
                <Input id="department" {...register("department")} />
              </Field>
              <Field label="Referencia" htmlFor="reference" className="sm:col-span-2">
                <Input id="reference" {...register("reference")} />
              </Field>
            </div>
          )}
        </fieldset>

        <fieldset className="surface space-y-4 p-6">
          <legend className="sr-only">Notas</legend>
          <h2 className="text-fg text-lg font-semibold">3. Comentarios (opcional)</h2>
          <Textarea
            id="customerNotes"
            aria-label="Comentarios del pedido"
            placeholder="Horarios de preferencia, requerimiento de factura, etc."
            {...register("customerNotes")}
          />
          <label className="text-fg-muted flex items-start gap-2.5 text-sm">
            <Checkbox className="mt-0.5" {...register("consent")} />
            <span>
              Acepto los{" "}
              <Link
                href="/legal/terminos"
                target="_blank"
                className="text-brand-cyan hover:underline"
              >
                Términos y condiciones
              </Link>{" "}
              y autorizo el tratamiento de mis datos conforme a la{" "}
              <Link
                href="/legal/privacidad"
                target="_blank"
                className="text-brand-cyan hover:underline"
              >
                Política de privacidad
              </Link>
              .
            </span>
          </label>
          {errors.consent && (
            <p role="alert" className="text-danger text-xs">
              {errors.consent.message}
            </p>
          )}
        </fieldset>
      </div>

      <aside className="surface h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 className="text-fg text-lg font-semibold">Tu pedido</h2>
        <ul className="divide-y divide-white/6 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 py-2.5">
              <span className="text-fg-muted">
                <span className="text-fg">{r.quantity}×</span> {r.name}
              </span>
              <span className="text-fg shrink-0">{formatPEN(r.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-white/8 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd>{formatPEN(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-muted">Envío</dt>
            <dd>
              {shipping === null ? (
                <span className="text-fg-subtle">
                  {shippingFrom != null
                    ? `Desde ${formatPEN(shippingFrom)} · por cotizar`
                    : "Por cotizar"}
                </span>
              ) : shipping === 0 ? (
                "Sin costo"
              ) : (
                formatPEN(shipping)
              )}
            </dd>
          </div>
        </dl>
        <div className="flex justify-between border-t border-white/8 pt-4 font-semibold">
          <span>Total</span>
          <span className="font-display text-xl">{formatPEN(subtotal + (shipping ?? 0))}</span>
        </div>
        {problems.length > 0 && (
          <Alert tone="warning">
            Hay productos sin stock suficiente.{" "}
            <Link href="/carrito" className="underline">
              Revisa tu carrito
            </Link>
            .
          </Alert>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || problems.length > 0}
        >
          {pending ? "Registrando pedido…" : "Confirmar pedido"}
        </Button>
        <p className="text-fg-subtle text-xs leading-relaxed">
          No se realizará ningún cobro en línea. ELZIIUS confirmará la disponibilidad y coordinará
          contigo el pago y la entrega.
        </p>
      </aside>
    </form>
  );
}
