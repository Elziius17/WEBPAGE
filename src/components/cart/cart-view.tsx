"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, AlertTriangle, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useCartSnapshot } from "@/hooks/use-cart-snapshot";
import { ProductImage } from "@/components/products/product-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { formatPEN } from "@/lib/utils/money";

export function CartView() {
  const { cart, rows, loading, subtotal, problems, unavailableIds } = useCartSnapshot();

  // Retira del carrito los productos que ya no están publicados.
  useEffect(() => {
    unavailableIds.forEach((id) => cart.remove(id));
  }, [unavailableIds, cart]);

  if (loading) return <div className="surface h-64 animate-pulse" aria-busy="true" aria-label="Cargando carrito" />;
  if (!rows.length)
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Tu carrito está vacío"
        description="Explora la tienda y agrega los productos que necesitas."
        action={<ButtonLink href="/tienda">Ir a la tienda</ButtonLink>}
      />
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {problems.length > 0 && (
          <Alert tone="warning" title="Ajusta las cantidades">
            Algunos productos tienen menos unidades disponibles que las solicitadas.
          </Alert>
        )}
        <ul className="space-y-3">
          {rows.map((r) => {
            const over = r.quantity > r.available;
            return (
              <li key={r.id} className="surface flex gap-4 p-4">
                <Link href={`/tienda/${r.slug}`} className="w-24 shrink-0 overflow-hidden rounded-xl">
                  <ProductImage src={r.image} alt={r.name} className="aspect-square" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-fg-subtle uppercase">{r.brand}</p>
                      <Link href={`/tienda/${r.slug}`} className="line-clamp-2 font-semibold text-fg hover:text-brand-cyan">{r.name}</Link>
                    </div>
                    <p className="shrink-0 font-semibold text-fg">{formatPEN(r.lineTotal)}</p>
                  </div>
                  <p className="mt-1 text-xs text-fg-subtle">{formatPEN(r.priceCents)} c/u</p>
                  {over && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                      <AlertTriangle className="size-3.5" aria-hidden />
                      {r.available === 0 ? "Agotado" : `Solo ${r.available} disponible(s)`}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-xl border border-white/10" role="group" aria-label={`Cantidad de ${r.name}`}>
                      <button type="button" className="grid size-9 cursor-pointer place-items-center text-fg-muted hover:text-fg disabled:opacity-40" onClick={() => cart.setQuantity(r.id, r.quantity - 1)} disabled={r.quantity <= 1} aria-label="Disminuir">
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{r.quantity}</span>
                      <button type="button" className="grid size-9 cursor-pointer place-items-center text-fg-muted hover:text-fg disabled:opacity-40" onClick={() => cart.setQuantity(r.id, r.quantity + 1)} disabled={r.quantity >= r.available} aria-label="Aumentar">
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => cart.remove(r.id)}>
                      <Trash2 /> Quitar
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="surface h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-fg">Resumen de compra</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="text-fg">{formatPEN(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-muted">Envío</dt><dd className="text-fg-subtle">Se calcula en el checkout</dd></div>
        </dl>
        <div className="flex justify-between border-t border-white/8 pt-4 font-semibold">
          <span>Total estimado</span>
          <span className="font-display text-xl">{formatPEN(subtotal)}</span>
        </div>
        {problems.length > 0 ? (
          <Button disabled className="w-full" size="lg">Corrige las cantidades</Button>
        ) : (
          <ButtonLink href="/checkout" className="w-full" size="lg">Continuar <ArrowRight /></ButtonLink>
        )}
        <p className="text-xs text-fg-subtle">Los precios y el stock se verifican nuevamente al registrar tu pedido.</p>
      </aside>
    </div>
  );
}
