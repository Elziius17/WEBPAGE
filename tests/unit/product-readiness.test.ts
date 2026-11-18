import { describe, expect, it } from "vitest";
import { productReadiness } from "@/services/product-readiness";

const base = {
  status: "DRAFT",
  priceCents: 27590,
  costCents: 21900,
  stock: 10,
  reserved: 0,
  description: "Audífonos gamer con micrófono y sonido 7.1",
  warrantyDays: 45,
  deletedAt: null,
  category: { active: true, deletedAt: null },
  _count: { images: 1 },
};

describe("producto listo para publicar", () => {
  it("con precio, stock, foto, categoría activa y descripción está listo", () => {
    expect(productReadiness(base).ready).toBe(true);
  });
  it("sin foto o sin stock disponible no se puede publicar", () => {
    expect(productReadiness({ ...base, _count: { images: 0 } }).missing.map((m) => m.key)).toEqual([
      "image",
    ]);
    expect(productReadiness({ ...base, reserved: 10 }).ready).toBe(false);
  });
  it("una categoría que ya no se vende bloquea la publicación", () => {
    expect(productReadiness({ ...base, category: { active: false, deletedAt: null } }).ready).toBe(
      false,
    );
  });
  it("costo mayor que el precio solo es una advertencia", () => {
    const r = productReadiness({ ...base, costCents: 30000 });
    expect(r.ready).toBe(true);
    expect(r.checks.find((c) => c.key === "margin")?.ok).toBe(false);
  });
});
