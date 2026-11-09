import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import { protocols } from "@/config/protocols";

export const metadata: Metadata = {
  title: "Protocolos corporativos",
  description:
    "Conoce los procedimientos de ELZIIUS: recepción, diagnóstico, reparación, control de calidad, entrega y protección de datos.",
  alternates: { canonical: "/protocolos" },
};

export default function ProtocolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Protocolos ELZIIUS"
        title="Así cuidamos tu equipo en cada etapa"
        description="Trabajamos con procedimientos documentados para garantizar calidad, transparencia y protección de tu información."
        breadcrumbs={[{ label: "Protocolos" }]}
      />
      <Container className="py-10">
        <nav
          aria-label="Protocolos"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {protocols.map((p) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className="surface surface-hover flex flex-col items-center gap-2 p-4 text-center"
            >
              <DynamicIcon name={p.icon} className="text-brand-cyan size-6" />
              <span className="text-fg-subtle text-xs">Protocolo {p.code}</span>
              <span className="text-fg text-sm font-semibold">{p.title}</span>
            </a>
          ))}
        </nav>
      </Container>
      {protocols.map((p, idx) => (
        <Section
          key={p.slug}
          id={p.slug}
          className={idx % 2 ? "bg-ink-900/40 scroll-mt-20" : "scroll-mt-20"}
        >
          <Container className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <span className="from-brand-blue/25 to-brand-cyan/10 text-brand-cyan ring-brand-cyan/20 grid size-14 place-items-center rounded-2xl bg-gradient-to-br ring-1">
                <DynamicIcon name={p.icon} className="size-7" />
              </span>
              <p className="text-brand-cyan mt-5 text-xs font-semibold tracking-[0.2em] uppercase">
                Protocolo {p.code}
              </p>
              <h2 className="text-fg mt-2 text-3xl font-bold">{p.title}</h2>
              <p className="text-fg-muted mt-3 leading-relaxed">{p.summary}</p>
            </div>
            <ol className="before:from-brand-cyan/60 relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-gradient-to-b before:to-transparent">
              {p.steps.map((s, i) => (
                <li key={s.t} className="relative flex gap-5">
                  <span className="border-brand-cyan/40 bg-ink-900 font-display text-brand-cyan relative z-10 grid size-10 shrink-0 place-items-center rounded-full border text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="surface flex-1 p-5">
                    <h3 className="text-fg font-semibold">{s.t}</h3>
                    <p className="text-fg-muted mt-1 text-sm">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ))}
    </>
  );
}
