"use client";
import { useEffect, useMemo, useState } from "react";
import { getCartSnapshot, type CartSnapshotItem } from "@/actions/public";
import { useCart } from "./use-cart";

/** Combina el carrito local con precios/stock actuales del servidor. */
export function useCartSnapshot() {
  const cart = useCart();
  const [snapshot, setSnapshot] = useState<{ ids: string; items: CartSnapshotItem[] } | null>(null);
  const ids = useMemo(() => cart.lines.map((l) => l.productId).sort().join(","), [cart.lines]);

  useEffect(() => {
    let alive = true;
    const list = ids ? ids.split(",") : [];
    if (!list.length) return;
    getCartSnapshot(list)
      .then((r) => alive && setSnapshot({ ids, items: r }))
      .catch(() => alive && setSnapshot({ ids, items: [] }));
    return () => {
      alive = false;
    };
  }, [ids]);

  // El snapshot solo es válido si corresponde exactamente a los IDs actuales del carrito.
  const fresh = !ids ? { ids, items: [] as CartSnapshotItem[] } : snapshot?.ids === ids ? snapshot : null;
  const items = fresh?.items ?? null;

  const rows = (items ?? [])
    .map((p) => {
      const line = cart.lines.find((l) => l.productId === p.id);
      return line ? { ...p, quantity: line.quantity, lineTotal: p.priceCents * line.quantity } : null;
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
  const unavailableIds = items ? cart.lines.filter((l) => !items.some((p) => p.id === l.productId)).map((l) => l.productId) : [];
  const problems = rows.filter((r) => r.quantity > r.available);
  const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);

  return { cart, rows, loading: items === null, subtotal, problems, unavailableIds };
}
