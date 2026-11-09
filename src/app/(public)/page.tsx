import { ArrowRight, MessageSquareQuote, Star } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Steps } from "@/components/home/steps";
import { Faq } from "@/components/home/faq";
import { ServiceCard } from "@/components/services/service-card";
import { ProductCard } from "@/components/products/product-card";
import { Container, Section, SectionHeader } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { DynamicIcon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { benefits, faqs, purchaseProcess, techProcess } from "@/config/content";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { getFeaturedProducts } from "@/services/catalog";
import { whatsappMessages } from "@/lib/whatsapp";

export default async function HomePage() {
  const [services, products, testimonials] = await Promise.all([
    db.service.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    getFeaturedProducts(4),
    db.testimonial.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo/elziius-logo-original.jpg`,
    areaServed: "PE",
    currenciesAccepted: "PEN",
    knowsLanguage: "es",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />

      {/* Presentación empresarial */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-brand-cyan mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              Quiénes somos
            </p>
            <h2 className="text-fg text-3xl font-bold sm:text-4xl">
              Soluciones tecnológicas integrales, con procesos claros
            </h2>
            <p className="text-fg-muted mt-5 leading-relaxed">
              ELZIIUS reúne servicio técnico especializado, comercio de componentes y desarrollo web
              en una sola plataforma. Trabajamos con protocolos documentados en cada etapa:
              recepción, diagnóstico, reparación, control de calidad y entrega.
            </p>
            <p className="text-fg-muted mt-4 leading-relaxed">
              Atendemos a particulares y empresas que buscan un aliado tecnológico confiable,
              transparente y comprometido con resultados.
            </p>
            <ButtonLink href="/nosotros" variant="link" className="mt-4">
              Conoce más sobre ELZIIUS <ArrowRight />
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Soporte", "Mantenimiento, reparación e instalación de software"],
              ["Hardware", "Componentes, periféricos, monitores e impresoras"],
              ["Web", "Landing pages, webs corporativas y tiendas virtuales"],
              ["Empresas", "Planes de mantenimiento y soporte a usuarios"],
            ].map(([t, d]) => (
              <div key={t} className="surface p-5">
                <p className="font-display text-gradient text-lg font-bold">{t}</p>
                <p className="text-fg-muted mt-1.5 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Servicios destacados */}
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader
            eyebrow="Servicios"
            title="Servicios IT para hogares y empresas"
            description="Desde un mantenimiento preventivo hasta soluciones empresariales completas."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/servicios" variant="secondary">
              Ver todos los servicios <ArrowRight />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Productos destacados */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Tienda"
            title="Productos destacados"
            description="Componentes y periféricos seleccionados, con garantía y asesoría de compatibilidad."
          />
          {products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareQuote}
              title="Pronto publicaremos nuestros productos"
              description="Mientras tanto, consúltanos por disponibilidad."
            />
          )}
          <div className="mt-10 text-center">
            <ButtonLink href="/tienda" variant="secondary">
              Ir a la tienda <ArrowRight />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Beneficios */}
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader eyebrow="Beneficios" title="¿Por qué trabajar con ELZIIUS?" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="surface p-6">
                <DynamicIcon name={b.icon} className="text-brand-cyan size-6" />
                <h3 className="text-fg mt-4 font-semibold">{b.title}</h3>
                <p className="text-fg-muted mt-1.5 text-sm leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Proceso técnico */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Servicio técnico"
            title="Proceso de atención técnica"
            description="Cada paso queda registrado y puedes seguirlo en línea con tu código de orden."
          />
          <Steps steps={techProcess} />
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/protocolos" variant="secondary">
              Ver nuestros protocolos
            </ButtonLink>
            <ButtonLink href="/seguimiento">
              Consultar mi equipo <ArrowRight />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Proceso de compra */}
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader
            eyebrow="Compras"
            title="Proceso de compra y entrega"
            description="Compra sin complicaciones: confirmamos stock y coordinamos contigo el pago y la entrega."
          />
          <Steps steps={purchaseProcess} columns={4} />
        </Container>
      </Section>

      {/* Testimonios */}
      <Section>
        <Container>
          <SectionHeader eyebrow="Testimonios" title="Lo que dicen nuestros clientes" />
          {testimonials.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="surface p-6">
                  <div
                    className="text-warning flex gap-0.5"
                    aria-label={`${t.rating} de 5 estrellas`}
                  >
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="text-fg-muted mt-4 text-sm leading-relaxed">
                    “{t.content}”
                  </blockquote>
                  <figcaption className="text-fg mt-4 text-sm font-semibold">
                    {t.authorName}
                    {t.authorRole && (
                      <span className="text-fg-subtle block text-xs font-normal">
                        {t.authorRole}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareQuote}
              title="Muy pronto, opiniones reales de nuestros clientes"
              description="Publicamos únicamente testimonios verificados. ¿Ya trabajaste con nosotros? Cuéntanos tu experiencia."
              action={
                <ButtonLink href="/contacto?tipo=testimonio" variant="secondary" size="sm">
                  Dejar mi opinión
                </ButtonLink>
              }
            />
          )}
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
          <Faq items={faqs} />
        </Container>
      </Section>

      {/* Contacto */}
      <Section>
        <Container>
          <div className="border-brand-cyan/20 from-ink-800 via-ink-850 to-ink-900 relative overflow-hidden rounded-3xl border bg-gradient-to-br p-8 sm:p-14">
            <div
              className="bg-brand-cyan/20 absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <h2 className="text-fg text-3xl font-bold sm:text-4xl">
                ¿Listo para resolver tu necesidad tecnológica?
              </h2>
              <p className="text-fg-muted mt-4">
                Escríbenos por WhatsApp o déjanos tus datos y te contactamos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton message={whatsappMessages.general()} size="lg" />
                <ButtonLink href="/contacto" variant="secondary" size="lg">
                  Formulario de contacto
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
