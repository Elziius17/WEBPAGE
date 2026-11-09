import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section, SectionHeader } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import { Steps } from "@/components/home/steps";
import { RequestForm } from "@/components/forms/request-form";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Diseño y desarrollo de páginas web",
  description:
    "Landing pages, páginas corporativas, catálogos digitales y tiendas virtuales con diseño responsive, SEO e integración con WhatsApp.",
  alternates: { canonical: "/desarrollo-web" },
};

const offers = [
  {
    icon: "layout-template",
    t: "Landing pages",
    d: "Páginas enfocadas en conversión para campañas y lanzamientos.",
  },
  {
    icon: "building",
    t: "Páginas corporativas",
    d: "Presencia profesional para tu empresa o emprendimiento.",
  },
  {
    icon: "book-open",
    t: "Catálogos digitales",
    d: "Muestra tus productos o servicios de forma ordenada y atractiva.",
  },
  {
    icon: "shopping-bag",
    t: "Tiendas virtuales",
    d: "Vende en línea con carrito, gestión de pedidos e inventario.",
  },
  { icon: "form-input", t: "Formularios", d: "Captación de clientes, cotizaciones y reservas." },
  {
    icon: "message-circle",
    t: "Integración de WhatsApp",
    d: "Conecta a tus visitantes directamente con tu equipo comercial.",
  },
  {
    icon: "smartphone",
    t: "Diseño responsive",
    d: "Se ve y funciona perfecto en celulares, tablets y computadoras.",
  },
  { icon: "search-check", t: "SEO", d: "Estructura optimizada para aparecer en buscadores." },
  { icon: "globe", t: "Hosting y dominio", d: "Asesoría y gestión de publicación de tu sitio." },
];

const process = [
  { title: "Requerimientos", text: "Conversamos sobre tus objetivos, público y contenido." },
  { title: "Propuesta", text: "Te enviamos alcance, tiempos y cotización." },
  { title: "Diseño", text: "Diseñamos la interfaz alineada a tu identidad." },
  { title: "Desarrollo", text: "Construimos el sitio, rápido, seguro y optimizado." },
  { title: "Revisión", text: "Ajustamos detalles contigo antes de publicar." },
  { title: "Publicación", text: "Publicamos y te capacitamos para gestionarlo." },
];

export default function WebDevPage() {
  return (
    <>
      <PageHero
        eyebrow="Desarrollo web"
        title={
          <>
            Tu negocio merece una <span className="text-gradient">web profesional</span>
          </>
        }
        description="Diseñamos y desarrollamos sitios modernos, rápidos y preparados para captar clientes."
        breadcrumbs={[{ label: "Desarrollo web" }]}
      >
        <div className="flex flex-wrap gap-3">
          <WhatsAppButton
            message={whatsappMessages.webProject()}
            label="Cotizar por WhatsApp"
            size="lg"
          />
          <a
            href="#cotizar"
            className="text-fg hover:border-brand-cyan/40 inline-flex h-12 items-center rounded-xl border border-white/12 bg-white/5 px-6 font-semibold"
          >
            Solicitar cotización
          </a>
        </div>
      </PageHero>
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Qué hacemos"
            title="Soluciones web para cada etapa de tu negocio"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <div key={o.t} className="surface surface-hover p-6">
                <DynamicIcon name={o.icon} className="text-brand-cyan size-6" />
                <h3 className="text-fg mt-4 font-semibold">{o.t}</h3>
                <p className="text-fg-muted mt-1.5 text-sm">{o.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Section className="bg-ink-900/40">
        <Container>
          <SectionHeader eyebrow="Metodología" title="Cómo trabajamos tu proyecto" />
          <Steps steps={process} />
        </Container>
      </Section>
      <Section id="cotizar" className="scroll-mt-20">
        <Container className="max-w-3xl">
          <SectionHeader
            title="Solicita tu cotización"
            description="Cuéntanos sobre tu proyecto y te enviaremos una propuesta."
          />
          <div className="surface p-6 sm:p-8">
            <RequestForm
              kind="WEB_PROJECT"
              serviceSlug="desarrollo-web"
              showCompany
              messageLabel="¿Qué tipo de web necesitas? Objetivos, secciones, referencias…"
              submitLabel="Solicitar cotización"
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
