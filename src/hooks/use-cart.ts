"use client";
import { useSyncExternalStore } from "react";

/**
 * Carrito en el navegador. Solo guarda IDs y cantidades: los precios y el stock
 * se consultan SIEMPRE al servidor (no se confía en datos del cliente).
 */
export type CartLine = { productId: string; quantity: number };

const KEY = "elziius.cart.v1";
const MAX_QTY = 20;
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? parsed
          .filter((l): l is CartLine => typeof l?.productId === "string" && Number.isInteger(l?.quantity))
          .map((l) => ({ productId: l.productId, quantity: Math.min(Math.max(1, l.quantity), MAX_QTY) }))
          .slice(0, 30)
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // almacenamiento no disponible (modo privado): el carrito vive en memoria
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  add(productId: string, quantity = 1, max = MAX_QTY) {
    const lines = [...read()];
    const i = lines.findIndex((l) => l.productId === productId);
    const limit = Math.min(max, MAX_QTY);
    if (i >= 0) lines[i] = { productId, quantity: Math.min(lines[i]!.quantity + quantity, limit) };
    else lines.push({ productId, quantity: Math.min(quantity, limit) });
    write(lines);
  },
  setQuantity(productId: string, quantity: number) {
    write(
      read()
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.min(Math.max(1, quantity), MAX_QTY) } : l)),
    );
  },
  remove(productId: string) {
    write(read().filter((l) => l.productId !== productId));
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return { lines, count, ...cart };
}
