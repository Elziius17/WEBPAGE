import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { DynamicIcon } from "@/components/ui/icon";
import { protocols } from "@/config/protocols";

export const metadata: Metadata = {
  title: "Protocolos corporativos",
  description: "Conoce los procedimientos de ELZIIUS: recepción, diagnóstico, reparación, control de calidad, entrega y protección de datos.",
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
        <nav aria-label="Protocolos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {protocols.map((p) => (
            <a key={p.slug} href={`#${p.slug}`} className="surface surface-hover flex flex-col items-center gap-2 p-4 text-center">
              <DynamicIcon name={p.icon} className="size-6 text-brand-cyan" />
              <span className="text-xs text-fg-subtle">Protocolo {p.code}</span>
              <span className="text-sm font-semibold text-fg">{p.title}</span>
            </a>
          ))}
        </nav>
      </Container>
      {protocols.map((p, idx) => (
        <Section key={p.slug} id={p.slug} className={idx % 2 ? "scroll-mt-20 bg-ink-900/40" : "scroll-mt-20"}>
          <Container className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue/25 to-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20">
                <DynamicIcon name={p.icon} className="size-7" />
              </span>
              <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-brand-cyan uppercase">Protocolo {p.code}</p>
              <h2 className="mt-2 text-3xl font-bold text-fg">{p.title}</h2>
              <p className="mt-3 leading-relaxed text-fg-muted">{p.summary}</p>
            </div>
            <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-gradient-to-b before:from-brand-cyan/60 before:to-transparent">
              {p.steps.map((s, i) => (
                <li key={s.t} className="relative flex gap-5">
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-brand-cyan/40 bg-ink-900 font-display text-sm font-bold text-brand-cyan">
                    {i + 1}
                  </span>
                  <div className="surface flex-1 p-5">
                    <h3 className="font-semibold text-fg">{s.t}</h3>
                    <p className="mt-1 text-sm text-fg-muted">{s.d}</p>
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
