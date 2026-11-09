import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/products/product-card";
import { CatalogFilters, SortSelect, buildQuery } from "@/components/products/catalog-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { DynamicIcon } from "@/components/ui/icon";
import { getBrands, getCategoriesWithCount, listProducts, SORT_OPTIONS, type SortKey } from "@/services/catalog";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Tienda de componentes y periféricos",
  description: "Procesadores, memorias RAM, SSD NVMe, tarjetas gráficas, monitores, impresoras y accesorios con garantía. Precios en soles.",
  alternates: { canonical: "/tienda" },
};

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 100) || undefined;
const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

export default async function StorePage({ searchParams }: PageProps<"/tienda">) {
  const sp = await searchParams;
  const params = {
    q: str(sp.q),
    categoria: str(sp.categoria),
    marca: str(sp.marca),
    min: str(sp.min),
    max: str(sp.max),
    stock: str(sp.stock),
    promo: str(sp.promo),
    orden: str(sp.orden),
    pagina: str(sp.pagina),
  };
  const sort = (params.orden && params.orden in SORT_OPTIONS ? params.orden : "relevance") as SortKey;
  const page = Math.max(1, Number(params.pagina) || 1);

  const [result, categories, brands] = await Promise.all([
    listProducts({
      q: params.q,
      category: params.categoria,
      brand: params.marca,
      minPrice: num(params.min),
      maxPrice: num(params.max),
      inStock: params.stock === "1",
      promo: params.promo === "1",
      sort,
      page,
    }),
    getCategoriesWithCount(),
    getBrands(),
  ]);
  const activeCategory = categories.find((c) => c.slug === params.categoria);

  return (
    <>
      <PageHero
        eyebrow="Tienda ELZIIUS"
        title={activeCategory ? activeCategory.name : "Componentes, periféricos e impresoras"}
        description="Precios en soles (PEN). Confirmamos la disponibilidad y coordinamos contigo el pago y la entrega."
        breadcrumbs={activeCategory ? [{ href: "/tienda", label: "Tienda" }, { label: activeCategory.name }] : [{ label: "Tienda" }]}
      />
      <Container className="py-10">
        <nav aria-label="Categorías" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={buildQuery({}, { categoria: c.slug })}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors",
                params.categoria === c.slug ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : "border-white/8 bg-white/3 text-fg-muted hover:text-fg",
              )}
            >
              <DynamicIcon name={c.icon} className="size-4" /> {c.name}
            </Link>
          ))}
        </nav>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="surface h-fit p-5 lg:sticky lg:top-24">
            <CatalogFilters params={params} categories={categories} brands={brands} />
          </aside>
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-fg-muted" aria-live="polite">
                {result.total} producto{result.total === 1 ? "" : "s"}
                {params.q && <> para “<span className="text-fg">{params.q}</span>”</>}
              </p>
              <SortSelect params={params} />
            </div>
            {result.items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <EmptyState
                icon={PackageSearch}
                title="No encontramos productos con esos filtros"
                description="Prueba con otros términos o consúltanos: podemos conseguir el componente que necesitas."
                action={<ButtonLink href="/contacto?tipo=producto" variant="secondary" size="sm">Consultar un producto</ButtonLink>}
              />
            )}
            {result.pages > 1 && (
              <nav aria-label="Paginación" className="mt-10 flex justify-center gap-1.5">
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={buildQuery(params, { pagina: n === 1 ? undefined : String(n) })}
                    aria-current={n === result.page ? "page" : undefined}
                    className={cn(
                      "grid size-10 place-items-center rounded-lg border text-sm",
                      n === result.page ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : "border-white/8 text-fg-muted hover:text-fg",
                    )}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
