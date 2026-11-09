import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPEN } from "@/lib/utils/money";
import type { ProductCardData } from "@/services/catalog";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export function stockInfo(p: { stock: number; reserved: number }) {
  const available = Math.max(0, p.stock - p.reserved);
  if (available === 0) return { available, label: "Agotado", tone: "danger" as const };
  if (available <= 3) return { available, label: `Últimas ${available} unidades`, tone: "warning" as const };
  return { available, label: "Disponible", tone: "success" as const };
}

export function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-ink-800 to-ink-900 ${className ?? ""}`}>
        <Package className="size-12 text-ink-500" aria-hidden />
      </div>
    );
  return (
    <div className={`relative overflow-hidden bg-ink-900 ${className ?? ""}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized={src.startsWith("/api/")} />
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const stock = stockInfo(product);
  const discount =
    product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents
      ? Math.round((1 - product.priceCents / product.compareAtPriceCents) * 100)
      : null;
  return (
    <article className="surface surface-hover group relative flex flex-col overflow-hidden">
      <Link href={`/tienda/${product.slug}`} className="relative block" tabIndex={-1} aria-hidden>
        <ProductImage src={product.images[0]?.url} alt={product.images[0]?.alt ?? product.name} className="aspect-[4/3]" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {discount && <Badge tone="accent">-{discount}%</Badge>}
          {product.isDemo && <Badge tone="warning">DEMO</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">
          {product.brand} · {product.category.name}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-semibold text-fg">
          <Link href={`/tienda/${product.slug}`} className="after:absolute focus:outline-none hover:text-brand-cyan">
            {product.name}
          </Link>
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-fg">{formatPEN(product.priceCents)}</span>
          {discount && <span className="text-sm text-fg-subtle line-through">{formatPEN(product.compareAtPriceCents)}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Badge tone={stock.tone}>{stock.label}</Badge>
          <div className="relative z-10"><AddToCartButton productId={product.id} available={stock.available} compact /></div>
        </div>
      </div>
    </article>
  );
}
