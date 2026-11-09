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

export async function generateMetadata({
  params,
}: PageProps<"/servicios/[slug]">): Promise<Metadata> {
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
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "PEN",
            price: (service.referencePriceCents / 100).toFixed(2),
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHero
        eyebrow={`Servicio ${service.code}`}
        title={service.name}
        description={service.shortDescription}
        breadcrumbs={[{ href: "/servicios", label: "Servicios" }, { label: service.name }]}
      >
        <div className="flex flex-wrap gap-3">
          <WhatsAppButton
            message={service.whatsappMessage || whatsappMessages.service(service.name)}
            size="lg"
            label="Solicitar por WhatsApp"
          />
          <a
            href="#solicitud"
            className="text-fg hover:border-brand-cyan/40 inline-flex h-12 items-center rounded-xl border border-white/12 bg-white/5 px-6 text-base font-semibold transition-colors"
          >
            Llenar formulario
          </a>
        </div>
      </PageHero>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <div className="flex gap-5">
              <span className="from-brand-blue/25 to-brand-cyan/10 text-brand-cyan ring-brand-cyan/20 hidden size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1 sm:grid">
                <DynamicIcon name={service.icon} className="size-8" />
              </span>
              <p className="text-fg-muted text-lg leading-relaxed">{service.description}</p>
            </div>

            <div>
              <h2 className="text-fg mb-4 text-xl font-bold">Beneficios</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {service.benefits.map((b) => (
                  <li key={b} className="surface text-fg-muted flex gap-3 p-4 text-sm">
                    <CheckCircle2 className="text-success size-5 shrink-0" aria-hidden /> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-fg mb-4 text-xl font-bold">Actividades incluidas</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {service.activities.map((a) => (
                  <li key={a} className="text-fg-muted flex items-center gap-2.5 text-sm">
                    <span className="bg-brand-cyan size-1.5 rounded-full" aria-hidden /> {a}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-fg mb-5 text-xl font-bold">Procedimiento</h2>
              <ol className="relative space-y-6 border-l border-white/10 pl-8">
                {service.procedure.map((p, i) => (
                  <li key={p} className="relative">
                    <span className="border-brand-cyan/40 bg-ink-900 text-brand-cyan absolute top-0 -left-[45px] grid size-7 place-items-center rounded-full border text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-fg pt-0.5">{p}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="surface space-y-4 p-6">
              <div className="flex items-start gap-3">
                <Clock className="text-brand-cyan mt-0.5 size-5" aria-hidden />
                <div>
                  <p className="text-fg text-sm font-semibold">Tiempo estimado</p>
                  <p className="text-fg-muted text-sm">
                    {service.estimatedTime || "Se informa tras la evaluación del equipo."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="text-brand-cyan mt-0.5 size-5" aria-hidden />
                <div>
                  <p className="text-fg text-sm font-semibold">Precio referencial</p>
                  <p className="text-fg-muted text-sm">
                    {service.referencePriceCents
                      ? `Desde ${formatPEN(service.referencePriceCents)}`
                      : "Según diagnóstico y requerimiento."}
                  </p>
                  {service.priceNote && (
                    <p className="text-fg-subtle mt-1 text-xs">{service.priceNote}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </Container>
      </Section>

      <Section id="solicitud" className="bg-ink-900/40 scroll-mt-20">
        <Container className="max-w-3xl">
          <h2 className="text-fg mb-2 text-2xl font-bold">
            Solicitar {service.name.toLowerCase()}
          </h2>
          <p className="text-fg-muted mb-6">
            Completa el formulario y te contactaremos para coordinar.
          </p>
          <div className="surface p-6 sm:p-8">
            <RequestForm
              kind="SERVICE"
              serviceSlug={service.slug}
              showDevice={service.slug !== "desarrollo-web"}
              showCompany={service.slug === "soluciones-empresariales"}
              messageLabel="Describe lo que necesitas"
            />
          </div>
        </Container>
      </Section>

      {others.length > 0 && (
        <Section>
          <Container>
            <h2 className="text-fg mb-6 text-2xl font-bold">Otros servicios</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {others.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
