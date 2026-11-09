import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, Store } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ProductCard, stockInfo } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getProductBySlug, getRelatedProducts } from "@/services/catalog";
import { formatPEN } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import { whatsappMessages } from "@/lib/whatsapp";
import { productConditionLabel } from "@/config/statuses";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: PageProps<"/tienda/[slug]">): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  const description = p.shortDescription ?? p.description.slice(0, 155);
  return {
    title: `${p.name} — ${p.brand}`,
    description,
    alternates: { canonical: `/tienda/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0].url }] : undefined },
    robots: p.isDemo ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/tienda/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.id, product.categoryId);
  const stock = stockInfo(product);
  const specs = (Array.isArray(product.specs) ? product.specs : []) as { label: string; value: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    model: product.model ?? undefined,
    description: product.description,
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteConfig.url}${i.url}`)),
    offers: {
      "@type": "Offer",
      priceCurrency: "PEN",
      price: (product.priceCents / 100).toFixed(2),
      availability: stock.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: product.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/RefurbishedCondition",
      url: `${siteConfig.url}/tienda/${product.slug}`,
    },
  };

  return (
    <>
      {!product.isDemo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <PageHero
        title={product.name}
        breadcrumbs={[
          { href: "/tienda", label: "Tienda" },
          { href: `/tienda?categoria=${product.category.slug}`, label: product.category.name },
          { label: product.name },
        ]}
      />
      <Section className="pt-10">
        <Container className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />
          <div>
            {product.isDemo && (
              <Alert tone="warning" title="Producto de demostración" className="mb-5">
                Este producto se cargó para probar la tienda; no es una oferta comercial real.
              </Alert>
            )}
            <p className="text-sm font-medium tracking-wide text-fg-subtle uppercase">
              {product.brand}{product.model ? ` · ${product.model}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={stock.tone}>{stock.label}</Badge>
              <Badge>{productConditionLabel[product.condition]}</Badge>
              <Badge>SKU {product.sku}</Badge>
            </div>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-fg">{formatPEN(product.priceCents)}</span>
              {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
                <span className="text-lg text-fg-subtle line-through">{formatPEN(product.compareAtPriceCents)}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-fg-subtle">Precio en soles, incluye IGV salvo indicación contraria.</p>
            {product.shortDescription && <p className="mt-6 leading-relaxed text-fg-muted">{product.shortDescription}</p>}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton productId={product.id} available={stock.available} />
              <WhatsAppButton message={whatsappMessages.product(product.name)} label="Consultar por WhatsApp" size="lg" variant="secondary" />
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="surface flex flex-col gap-1.5 p-4 text-sm">
                <ShieldCheck className="size-5 text-brand-cyan" aria-hidden />
                <span className="font-semibold text-fg">Garantía</span>
                <span className="text-fg-muted">{product.warrantyMonths > 0 ? `${product.warrantyMonths} meses` : "Consultar"}</span>
              </li>
              <li className="surface flex flex-col gap-1.5 p-4 text-sm">
                <Store className="size-5 text-brand-cyan" aria-hidden />
                <span className="font-semibold text-fg">Recojo</span>
                <span className="text-fg-muted">Coordinado</span>
              </li>
              <li className="surface flex flex-col gap-1.5 p-4 text-sm">
                <Truck className="size-5 text-brand-cyan" aria-hidden />
                <span className="font-semibold text-fg">Envío</span>
                <span className="text-fg-muted">Por courier, cotizado</span>
              </li>
            </ul>
          </div>
        </Container>
        <Container className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-fg">Descripción</h2>
            <p className="leading-relaxed whitespace-pre-line text-fg-muted">{product.description}</p>
            {product.warrantyNotes && <p className="mt-4 text-sm text-fg-subtle">Garantía: {product.warrantyNotes}</p>}
            <p className="mt-6 text-xs text-fg-subtle">Publicado el {formatDate(product.createdAt)}</p>
          </div>
          {specs.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-fg">Especificaciones técnicas</h2>
              <dl className="surface divide-y divide-white/6">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                    <dt className="text-fg-subtle">{s.label}</dt>
                    <dd className="text-fg">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Container>
      </Section>
      {related.length > 0 && (
        <Section className="bg-ink-900/40">
          <Container>
            <h2 className="mb-6 text-2xl font-bold text-fg">Productos relacionados</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
