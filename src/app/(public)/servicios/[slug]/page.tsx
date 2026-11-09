import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Tag } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import { RequestForm } from "@/components/forms/request-form";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ServiceCard } from "@/components/services/service-card";
import { db } from "@/lib/db";
import { formatPEN } from "@/lib/utils/money";
import { whatsappMessages } from "@/lib/whatsapp";
import { siteConfig } from "@/config/site";

async function getService(slug: string) {
  return db.service.findFirst({ where: { slug, active: true, deletedAt: null } });
}

export async function generateMetadata({ params }: PageProps<"/servicios/[slug]">): Promise<Metadata> {
  const s = await getService((await params).slug);
  if (!s) return { title: "Servicio no encontrado" };
  return {
    title: s.name,
    description: s.shortDescription,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: { title: `${s.name} | ELZIIUS`, description: s.shortDescription },
  };
}

export default async function ServiceDetailPage({ params }: PageProps<"/servicios/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  const others = await db.service.findMany({
    where: { active: true, deletedAt: null, id: { not: service.id } },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    areaServed: "PE",
    ...(service.referencePriceCents
      ? { offers: { "@type": "Offer", priceCurrency: "PEN", price: (service.referencePriceCents / 100).toFixed(2) } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow={`Servicio ${service.code}`}
        title={service.name}
        description={service.shortDescription}
        breadcrumbs={[{ href: "/servicios", label: "Servicios" }, { label: service.name }]}
      >
        <div className="flex flex-wrap gap-3">
          <WhatsAppButton message={service.whatsappMessage || whatsappMessages.service(service.name)} size="lg" label="Solicitar por WhatsApp" />
          <a href="#solicitud" className="inline-flex h-12 items-center rounded-xl border border-white/12 bg-white/5 px-6 text-base font-semibold text-fg transition-colors hover:border-brand-cyan/40">
            Llenar formulario
          </a>
        </div>
      </PageHero>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <div className="flex gap-5">
              <span className="hidden size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue/25 to-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20 sm:grid">
                <DynamicIcon name={service.icon} className="size-8" />
              </span>
              <p className="text-lg leading-relaxed text-fg-muted">{service.description}</p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-fg">Beneficios</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {service.benefits.map((b) => (
                  <li key={b} className="surface flex gap-3 p-4 text-sm text-fg-muted">
                    <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden /> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-fg">Actividades incluidas</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {service.activities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 text-sm text-fg-muted">
                    <span className="size-1.5 rounded-full bg-brand-cyan" aria-hidden /> {a}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-5 text-xl font-bold text-fg">Procedimiento</h2>
              <ol className="relative space-y-6 border-l border-white/10 pl-8">
                {service.procedure.map((p, i) => (
                  <li key={p} className="relative">
                    <span className="absolute top-0 -left-[45px] grid size-7 place-items-center rounded-full border border-brand-cyan/40 bg-ink-900 text-xs font-bold text-brand-cyan">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-fg">{p}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="surface space-y-4 p-6">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-brand-cyan" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-fg">Tiempo estimado</p>
                  <p className="text-sm text-fg-muted">{service.estimatedTime || "Se informa tras la evaluación del equipo."}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 size-5 text-brand-cyan" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-fg">Precio referencial</p>
                  <p className="text-sm text-fg-muted">
                    {service.referencePriceCents ? `Desde ${formatPEN(service.referencePriceCents)}` : "Según diagnóstico y requerimiento."}
                  </p>
                  {service.priceNote && <p className="mt-1 text-xs text-fg-subtle">{service.priceNote}</p>}
                </div>
              </div>
            </div>
          </aside>
        </Container>
      </Section>

      <Section id="solicitud" className="scroll-mt-20 bg-ink-900/40">
        <Container className="max-w-3xl">
          <h2 className="mb-2 text-2xl font-bold text-fg">Solicitar {service.name.toLowerCase()}</h2>
          <p className="mb-6 text-fg-muted">Completa el formulario y te contactaremos para coordinar.</p>
          <div className="surface p-6 sm:p-8">
            <RequestForm kind="SERVICE" serviceSlug={service.slug} showDevice={service.slug !== "desarrollo-web"} showCompany={service.slug === "soluciones-empresariales"} messageLabel="Describe lo que necesitas" />
          </div>
        </Container>
      </Section>

      {others.length > 0 && (
        <Section>
          <Container>
            <h2 className="mb-6 text-2xl font-bold text-fg">Otros servicios</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {others.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
