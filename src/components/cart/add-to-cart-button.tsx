"use client";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

export function AddToCartButton({
  productId,
  available,
  quantity = 1,
  compact,
}: {
  productId: string;
  available: number;
  quantity?: number;
  compact?: boolean;
}) {
  const { add, lines } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === productId)?.quantity ?? 0;
  const disabled = available <= 0 || inCart >= available;

  return (
    <Button
      size={compact ? "sm" : "lg"}
      variant={compact ? "secondary" : "primary"}
      disabled={disabled}
      onClick={() => {
        add(productId, quantity, available);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      aria-label={compact ? "Agregar al carrito" : undefined}
      className={compact ? "" : "w-full sm:w-auto"}
    >
      {added ? <Check /> : <ShoppingCart />}
      {compact ? (added ? "Agregado" : "Agregar") : available <= 0 ? "Sin stock" : added ? "Agregado al carrito" : "Agregar al carrito"}
    </Button>
  );
}
