import "server-only";

export type ReadinessCheck = { key: string; label: string; ok: boolean; required: boolean };

type ProductLike = {
  status: string;
  priceCents: number;
  costCents: number | null;
  stock: number;
  reserved: number;
  description: string;
  warrantyDays: number;
  deletedAt: Date | null;
  category: { active: boolean; deletedAt: Date | null };
  _count: { images: number };
};

/** Qué le falta a un producto para venderse en la tienda. */
export function productReadiness(p: ProductLike) {
  const checks: ReadinessCheck[] = [
    { key: "price", label: "Precio de venta", ok: p.priceCents > 0, required: true },
    { key: "stock", label: "Stock disponible", ok: p.stock - p.reserved > 0, required: true },
    { key: "image", label: "Al menos una foto", ok: p._count.images > 0, required: true },
    {
      key: "category",
      label: "Categoría activa en la tienda",
      ok: p.category.active && !p.category.deletedAt,
      required: true,
    },
    {
      key: "description",
      label: "Descripción",
      ok: p.description.trim().length >= 10,
      required: true,
    },
    {
      key: "cost",
      label: "Costo del proveedor (para ver tu margen)",
      ok: p.costCents != null,
      required: false,
    },
    {
      key: "margin",
      label: "Precio mayor que el costo",
      ok: p.costCents == null || p.priceCents > p.costCents,
      required: false,
    },
    { key: "warranty", label: "Garantía definida", ok: p.warrantyDays > 0, required: false },
  ];
  const missing = checks.filter((c) => c.required && !c.ok);
  return { checks, ready: missing.length === 0 && !p.deletedAt, missing };
}
