import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section, SectionHeader } from "@/components/ui/container";
import { ServiceCard } from "@/components/services/service-card";
import { RequestForm } from "@/components/forms/request-form";
import { Steps } from "@/components/home/steps";
import { techProcess } from "@/config/content";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Servicios de soporte técnico y TI",
  description:
    "Mantenimiento preventivo y correctivo, repotenciación, instalación de software, soporte técnico, desarrollo web y soluciones empresariales.",
  alternates: { canonical: "/servicios" },
};

export default async function ServicesPage() {
  const services = await db.service.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <PageHero
        eyebrow="Servicios IT"
        title="Servicios tecnológicos con procesos claros y garantía"
        description="Elige el servicio que necesitas. Cada uno cuenta con un procedimiento documentado y seguimiento en línea."
        breadcrumbs={[{ label: "Servicios" }]}
      />
      <Section>
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </Container>
      </Section>
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader eyebrow="Cómo trabajamos" title="Proceso de atención técnica" />
          <Steps steps={techProcess} />
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl">
          <SectionHeader
            title="Solicita un servicio"
            description="Cuéntanos qué necesitas y te contactaremos para coordinar."
          />
          <div className="surface p-6 sm:p-8">
            <RequestForm
              kind="SERVICE"
              showDevice
              messageLabel="Describe el problema o lo que necesitas"
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
