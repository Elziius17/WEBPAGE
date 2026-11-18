import type { Metadata } from "next";
import { BadgeCheck, ClipboardList, MessageCircle, Truck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { PcBuildForm } from "@/components/forms/pc-build-form";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Cotizar PC completa",
  description:
    "Cuéntanos para qué usarás tu computadora y tu presupuesto: te enviamos una cotización de PC armada a medida, con precio y disponibilidad en Perú.",
  alternates: { canonical: "/cotizar-pc" },
};

const steps = [
  { icon: ClipboardList, t: "Cuéntanos qué necesitas", d: "Uso, presupuesto y preferencias." },
  { icon: MessageCircle, t: "Te enviamos la cotización", d: "Con componentes, precio y plazo." },
  { icon: BadgeCheck, t: "Apruebas y armamos", d: "Ensamblada, probada y con garantía." },
  { icon: Truck, t: "Recojo o envío", d: "En Lima o a provincias." },
];

export default async function PcQuotePage() {
  const user = await getCurrentUser();
  const customer = user
    ? await db.customer.findUnique({
        where: { userId: user.id },
        select: { fullName: true, email: true, phone: true },
      })
    : null;
  return (
    <>
      <PageHero
        eyebrow="PC a medida"
        title="Cotiza tu PC completa"
        description="Arma tu computadora ideal sin complicarte: dinos para qué la usarás y cuánto quieres invertir, y te enviamos una propuesta con precio final."
        breadcrumbs={[{ label: "Cotizar PC completa" }]}
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
        <PcBuildForm
          defaults={{
            name: customer?.fullName ?? user?.name,
            email: customer?.email ?? user?.email,
            phone: customer?.phone || undefined,
          }}
        />
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-6">
            <h2 className="text-fg font-semibold">¿Cómo funciona?</h2>
            <ol className="mt-4 space-y-4">
              {steps.map(({ icon: Icon, t, d }, i) => (
                <li key={t} className="flex gap-3">
                  <span className="bg-brand-cyan/10 text-brand-cyan grid size-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-fg text-sm font-medium">
                      {i + 1}. {t}
                    </p>
                    <p className="text-fg-muted text-xs">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="surface p-6">
            <p className="text-fg text-sm font-medium">¿Prefieres conversarlo?</p>
            <p className="text-fg-muted mt-1 text-xs">
              Escríbenos y te ayudamos a definir la configuración.
            </p>
            <WhatsAppButton message={whatsappMessages.pcBuild()} className="mt-4 w-full" />
          </div>
          <p className="text-fg-subtle px-1 text-xs">
            La cotización no te obliga a comprar. Los precios dependen de la disponibilidad de stock
            de nuestros proveedores al momento de confirmar.
          </p>
        </aside>
      </Container>
    </>
  );
}
