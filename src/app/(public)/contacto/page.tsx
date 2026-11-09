import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { RequestForm } from "@/components/forms/request-form";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getPublicBusinessInfo } from "@/services/settings";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos para solicitar un servicio técnico, cotizar productos o un proyecto web.",
  alternates: { canonical: "/contacto" },
};

const kinds = {
  contacto: { kind: "CONTACT", label: "Mensaje" },
  cotizacion: { kind: "QUOTE", label: "Detalla los productos o servicios que deseas cotizar" },
  producto: {
    kind: "PRODUCT_INQUIRY",
    label: "¿Qué producto buscas? Marca, modelo, especificaciones…",
  },
  testimonio: { kind: "CONTACT", label: "Cuéntanos tu experiencia con ELZIIUS" },
} as const;

export default async function ContactPage({ searchParams }: PageProps<"/contacto">) {
  const sp = await searchParams;
  const tipo = (
    typeof sp.tipo === "string" && sp.tipo in kinds ? sp.tipo : "contacto"
  ) as keyof typeof kinds;
  const b = await getPublicBusinessInfo();
  const items = [
    b.phone && {
      icon: Phone,
      t: "Teléfono",
      v: b.phone,
      href: `tel:${b.phone.replace(/\s/g, "")}`,
    },
    b.email && { icon: Mail, t: "Correo", v: b.email, href: `mailto:${b.email}` },
    (b.address || b.city) && {
      icon: MapPin,
      t: "Ubicación",
      v: [b.address, b.city].filter(Boolean).join(", "),
    },
    b.schedule && { icon: Clock, t: "Horario de atención", v: b.schedule },
  ].filter(Boolean) as { icon: typeof Phone; t: string; v: string; href?: string }[];

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos de tu necesidad tecnológica"
        description="Respondemos por WhatsApp, llamada o correo, según tu preferencia."
        breadcrumbs={[{ label: "Contacto" }]}
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <div className="surface p-6 sm:p-8">
          <nav aria-label="Tipo de consulta" className="mb-6 flex flex-wrap gap-2">
            {[
              ["contacto", "Contacto"],
              ["cotizacion", "Cotización"],
              ["producto", "Consulta de producto"],
            ].map(([k, l]) => (
              <a
                key={k}
                href={`/contacto?tipo=${k}`}
                aria-current={tipo === k ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm ${tipo === k ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : "text-fg-muted hover:text-fg border-white/8"}`}
              >
                {l}
              </a>
            ))}
          </nav>
          <RequestForm
            key={tipo}
            kind={kinds[tipo].kind}
            showSubject={tipo === "contacto"}
            showCompany={tipo === "cotizacion"}
            messageLabel={kinds[tipo].label}
          />
        </div>
        <aside className="space-y-4">
          <div className="surface p-6">
            <h2 className="text-fg font-semibold">WhatsApp</h2>
            <p className="text-fg-muted mt-1 mb-4 text-sm">
              La forma más rápida de comunicarte con nosotros.
            </p>
            <WhatsAppButton message={whatsappMessages.general()} className="w-full" />
          </div>
          {items.length > 0 && (
            <div className="surface space-y-4 p-6">
              {items.map(({ icon: Icon, t, v, href }) => (
                <div key={t} className="flex gap-3">
                  <Icon className="text-brand-cyan mt-0.5 size-5" aria-hidden />
                  <div>
                    <p className="text-fg text-sm font-semibold">{t}</p>
                    {href ? (
                      <a href={href} className="text-fg-muted hover:text-fg text-sm">
                        {v}
                      </a>
                    ) : (
                      <p className="text-fg-muted text-sm whitespace-pre-line">{v}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </Container>
    </>
  );
}
