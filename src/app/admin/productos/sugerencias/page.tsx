import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus, TrendingUp } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { marketResearchDate, marketSuggestions, productKey } from "@/lib/market-suggestions";

export const metadata: Metadata = { title: "Productos sugeridos" };

export default async function SuggestionsPage() {
  await requireStaffPage("products:write");
  const [categories, products] = await Promise.all([
    db.category.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    db.product.findMany({
      where: { deletedAt: null, isDemo: false },
      select: { id: true, brand: true, model: true },
    }),
  ]);
  const existing = new Map(products.map((p) => [productKey(p.brand, p.model), p.id]));
  return (
    <>
      <AdminPageHeader
        title="Productos sugeridos"
        description={`Lo más buscado en Perú por categoría · investigación del ${marketResearchDate.split("-").reverse().join("/")}`}
        back={{ href: "/admin/productos", label: "Productos" }}
      />
      <Alert tone="info" className="mb-6">
        Cada sugerencia precarga el formulario con nombre, descripción y especificaciones. Tú
        defines el <strong>precio</strong>, el <strong>proveedor</strong>, el <strong>stock</strong>{" "}
        y subes las <strong>fotos</strong> (idealmente las que te entrega tu proveedor). Los precios
        mostrados son solo referencias de otras tiendas, no se publican.
      </Alert>
      <div className="space-y-6">
        {categories.map((c) => {
          const items = marketSuggestions.filter((s) => s.category === c.slug);
          if (!items.length) return null;
          return (
            <Panel key={c.slug} title={c.name}>
              <ul className="divide-y divide-white/6">
                {items.map((s) => {
                  const productId = existing.get(productKey(s.brand, s.model));
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-fg font-medium">{s.name}</p>
                        <p className="text-fg-muted text-sm">{s.shortDescription}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge tone={s.priceRangePEN ? "neutral" : "warning"}>
                            {s.priceRangePEN
                              ? `Ref. mercado: S/ ${s.priceRangePEN.min}–${s.priceRangePEN.max}`
                              : "Precio de mercado no verificado"}
                          </Badge>
                          {s.searchTerms.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-fg-subtle inline-flex items-center gap-1 text-xs"
                            >
                              <TrendingUp className="size-3" aria-hidden /> {t}
                            </span>
                          ))}
                          {s.officialUrl && (
                            <a
                              href={s.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-cyan inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              Ficha del fabricante <ExternalLink className="size-3" aria-hidden />
                            </a>
                          )}
                        </div>
                      </div>
                      {productId ? (
                        <Link
                          href={`/admin/productos/${productId}`}
                          className="text-success shrink-0 text-sm hover:underline"
                        >
                          Ya registrado →
                        </Link>
                      ) : (
                        <ButtonLink
                          href={`/admin/productos/nuevo?sugerencia=${s.id}`}
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                        >
                          <Plus /> Crear producto
                        </ButtonLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
