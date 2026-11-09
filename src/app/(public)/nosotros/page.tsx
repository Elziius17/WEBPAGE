import type { Metadata } from "next";
import { Eye, Target, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section, SectionHeader } from "@/components/ui/container";
import { LogoFull } from "@/components/brand/logo";
import { benefits } from "@/config/content";
import { DynamicIcon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "ELZIIUS: emprendimiento tecnológico de soporte técnico, comercio de hardware y desarrollo web.",
  alternates: { canonical: "/nosotros" },
};

const values = [
  {
    icon: Target,
    t: "Misión",
    d: "Transformar necesidades tecnológicas en soluciones reales, con servicio técnico confiable, productos de calidad y desarrollo web a la medida.",
  },
  {
    icon: Eye,
    t: "Visión",
    d: "Ser un referente en soluciones tecnológicas integrales para particulares y empresas, reconocido por su transparencia y calidad.",
  },
  {
    icon: HeartHandshake,
    t: "Compromiso",
    d: "Procesos documentados, comunicación clara y respeto absoluto por la información de nuestros clientes.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Tecnología con propósito"
        description="Somos ELZIIUS: soporte, hardware y web en un solo lugar."
        breadcrumbs={[{ label: "Nosotros" }]}
      />
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_380px]">
          <div className="text-fg-muted space-y-4 leading-relaxed">
            <p className="text-fg text-lg">
              ELZIIUS nace para acompañar a personas y empresas en sus necesidades tecnológicas,
              desde el mantenimiento de una laptop hasta la construcción de su presencia digital.
            </p>
            <p>
              Combinamos servicio técnico especializado de computadoras y laptops, la
              comercialización de componentes, periféricos e impresoras, y el diseño y desarrollo de
              páginas web.
            </p>
            <p>
              Creemos en el trabajo transparente: cada equipo que recibimos tiene una orden de
              servicio con código de seguimiento, cada intervención requiere autorización y cada
              entrega pasa un control de calidad.
            </p>
          </div>
          <div className="surface grid place-items-center p-10">
            <LogoFull className="h-56 w-auto" />
          </div>
        </Container>
      </Section>
      <Section className="bg-ink-900/40">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, t, d }) => (
              <div key={t} className="surface p-6">
                <Icon className="text-brand-cyan size-6" aria-hidden />
                <h2 className="text-fg mt-4 text-xl font-bold">{t}</h2>
                <p className="text-fg-muted mt-2 text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeader title="Lo que nos diferencia" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="surface p-6">
                <DynamicIcon name={b.icon} className="text-brand-cyan size-6" />
                <h3 className="text-fg mt-4 font-semibold">{b.title}</h3>
                <p className="text-fg-muted mt-1.5 text-sm">{b.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/contacto">Contáctanos</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
