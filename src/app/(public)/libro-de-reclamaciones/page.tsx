import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { ComplaintForm } from "@/components/forms/complaint-form";
import { getBusinessSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Libro de Reclamaciones virtual de ELZIIUS conforme al Código de Protección y Defensa del Consumidor.",
  alternates: { canonical: "/libro-de-reclamaciones" },
};

export default async function ComplaintsPage() {
  const s = await getBusinessSettings();
  return (
    <>
      <PageHero title="Libro de Reclamaciones" description="Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N.º 29571)." breadcrumbs={[{ label: "Libro de Reclamaciones" }]} />
      <Container className="max-w-4xl py-10">
        <div className="surface mb-6 grid gap-2 p-5 text-sm sm:grid-cols-3">
          <p><span className="block text-xs text-fg-subtle">Proveedor</span><span className="text-fg">{s.commercialName}</span></p>
          <p><span className="block text-xs text-fg-subtle">RUC</span><span className="text-fg">{s.ruc || "Por configurar"}</span></p>
          <p><span className="block text-xs text-fg-subtle">Domicilio</span><span className="text-fg">{[s.address, s.city].filter(Boolean).join(", ") || "Por configurar"}</span></p>
        </div>
        {!s.ruc && (
          <Alert tone="warning" className="mb-6" title="Datos del proveedor pendientes">
            El administrador debe completar la razón social, RUC y domicilio en Admin › Configuración.
          </Alert>
        )}
        <div className="surface p-6 sm:p-8">
          <ComplaintForm />
        </div>
        <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para
          interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a
          quince (15) días hábiles. [Plazo a validar por asesoría legal.]
        </p>
      </Container>
    </>
  );
}
