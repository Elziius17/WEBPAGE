import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { TrackingLookup } from "@/components/tracking/tracking-lookup";

export const metadata: Metadata = {
  title: "Seguimiento de servicio técnico",
  description:
    "Consulta en línea el estado de tu computadora o laptop con tu código de orden ELZIIUS.",
  alternates: { canonical: "/seguimiento" },
};

export default async function TrackingPage({ searchParams }: PageProps<"/seguimiento">) {
  const sp = await searchParams;
  const code = typeof sp.codigo === "string" ? sp.codigo.slice(0, 20) : undefined;
  return (
    <>
      <PageHero
        eyebrow="Seguimiento"
        title="Consulta el estado de tu equipo"
        description="Ingresa el código de orden que te entregamos al recibir tu equipo y el correo o teléfono que registraste."
        breadcrumbs={[{ label: "Seguimiento" }]}
      />
      <Container className="max-w-5xl py-10">
        <TrackingLookup initialCode={code} />
        <p className="text-fg-subtle mt-8 flex items-start gap-2 text-xs">
          <ShieldCheck className="text-brand-cyan size-4 shrink-0" aria-hidden />
          Por tu seguridad, solo mostramos información del servicio. Los datos personales,
          contraseñas y notas internas nunca se publican.
        </p>
      </Container>
    </>
  );
}
