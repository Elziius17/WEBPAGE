import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { legalDocs } from "@/config/legal";

export function generateStaticParams() {
  return legalDocs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  return doc
    ? {
        title: doc.title,
        description: doc.description,
        alternates: { canonical: `/legal/${doc.slug}` },
      }
    : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  if (!doc) notFound();
  return (
    <>
      <PageHero title={doc.title} breadcrumbs={[{ label: "Legal" }, { label: doc.title }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
        <nav
          aria-label="Documentos legales"
          className="space-y-1 lg:sticky lg:top-24 lg:self-start"
        >
          {legalDocs.map((d) => (
            <Link
              key={d.slug}
              href={`/legal/${d.slug}`}
              aria-current={d.slug === slug ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm ${d.slug === slug ? "bg-brand-cyan/10 text-brand-cyan" : "text-fg-muted hover:text-fg"}`}
            >
              {d.title}
            </Link>
          ))}
        </nav>
        <article className="prose-legal [&_a]:text-brand-cyan max-w-3xl [&_a]:hover:underline">
          <Alert tone="warning" title="Documento en revisión legal" className="mb-8">
            Este documento es un borrador base y debe ser revisado por un profesional del derecho
            antes de su publicación definitiva. No constituye asesoría jurídica.
          </Alert>
          <p className="text-fg-subtle text-sm">Última actualización: {doc.updated}</p>
          {doc.body}
        </article>
      </Container>
    </>
  );
}
