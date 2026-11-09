import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Input, Label, Select } from "@/components/ui/form";
import { SORT_OPTIONS } from "@/services/catalog";
import { cn } from "@/lib/utils/cn";

type Params = Record<string, string | undefined>;

export function buildQuery(base: Params, patch: Params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `/tienda?${s}` : "/tienda";
}

export function CatalogFilters({
  params,
  categories,
  brands,
}: {
  params: Params;
  categories: { slug: string; name: string; count: number }[];
  brands: string[];
}) {
  return (
    <form
      action="/tienda"
      method="get"
      className="space-y-6"
      role="search"
      aria-label="Filtrar productos"
    >
      <div>
        <Label htmlFor="q">Buscar</Label>
        <div className="relative">
          <Search
            className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="q"
            name="q"
            defaultValue={params.q}
            placeholder="Producto, marca, modelo…"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="categoria">Categoría</Label>
        <Select id="categoria" name="categoria" defaultValue={params.categoria ?? ""}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.count})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="marca">Marca</Label>
        <Select id="marca" name="marca" defaultValue={params.marca ?? ""}>
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>
      <fieldset>
        <legend className="text-fg mb-1.5 text-sm font-medium">Precio (S/)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="min"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            placeholder="Mín."
            defaultValue={params.min}
            aria-label="Precio mínimo"
          />
          <Input
            name="max"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            placeholder="Máx."
            defaultValue={params.max}
            aria-label="Precio máximo"
          />
        </div>
      </fieldset>
      <div className="space-y-2.5">
        <label className="text-fg-muted flex items-center gap-2.5 text-sm">
          <Checkbox name="stock" value="1" defaultChecked={params.stock === "1"} /> Solo con stock
        </label>
        <label className="text-fg-muted flex items-center gap-2.5 text-sm">
          <Checkbox name="promo" value="1" defaultChecked={params.promo === "1"} /> En promoción
        </label>
      </div>
      {params.orden && <input type="hidden" name="orden" value={params.orden} />}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <SlidersHorizontal /> Aplicar
        </Button>
        <ButtonLink href="/tienda" variant="ghost">
          Limpiar
        </ButtonLink>
      </div>
    </form>
  );
}

export function SortSelect({ params }: { params: Params }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ordenar por">
      {Object.entries(SORT_OPTIONS).map(([key, label]) => {
        const active = (params.orden ?? "relevance") === key;
        return (
          <Link
            key={key}
            href={buildQuery(params, {
              orden: key === "relevance" ? undefined : key,
              pagina: undefined,
            })}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                : "text-fg-muted hover:text-fg border-white/8",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
