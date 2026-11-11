import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validations/checkout";
import {
  publicRequestSchema,
  registerSchema,
  trackingLookupSchema,
} from "@/lib/validations/public";
import { productSchema, movementSchema } from "@/lib/validations/admin";

const base = {
  idempotencyKey: "6f1c2a3e-1b2c-4d5e-8f90-123456789abc",
  items: [{ productId: "p1", quantity: 1 }],
  contactName: "Ana Pérez",
  contactPhone: "987654321",
  deliveryMethod: "PICKUP",
  consent: true,
};

describe("checkout", () => {
  it("acepta un pedido de recojo válido", () => {
    expect(checkoutSchema.safeParse(base).success).toBe(true);
  });
  it("exige dirección para courier", () => {
    const r = checkoutSchema.safeParse({ ...base, deliveryMethod: "COURIER" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["line1", "district", "province", "department"]),
    );
  });
  it("rechaza cantidades inválidas, carrito vacío y falta de consentimiento", () => {
    expect(
      checkoutSchema.safeParse({ ...base, items: [{ productId: "p1", quantity: 0 }] }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...base, items: [{ productId: "p1", quantity: 999 }] }).success,
    ).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });
  it("no acepta precios enviados por el cliente (se ignoran campos extra)", () => {
    const r = checkoutSchema.safeParse({
      ...base,
      items: [{ productId: "p1", quantity: 1, priceCents: 1 }],
    });
    expect(r.success && "priceCents" in r.data.items[0]!).toBe(false);
  });
  it("trata un select vacío como no informado", () => {
    const r = checkoutSchema.safeParse({ ...base, documentType: "" });
    expect(r.success && r.data.documentType).toBeUndefined();
  });
});

describe("formularios públicos", () => {
  it("valida solicitud y honeypot", () => {
    const ok = {
      kind: "SERVICE",
      name: "Luis",
      phone: "955111222",
      message: "Mi laptop no enciende",
      consent: "on",
    };
    expect(publicRequestSchema.safeParse(ok).success).toBe(true);
    expect(publicRequestSchema.safeParse({ ...ok, website: "spam" }).success).toBe(false);
    expect(publicRequestSchema.safeParse({ ...ok, phone: "abc" }).success).toBe(false);
  });
  it("valida contraseña robusta y coincidencia", () => {
    const r = {
      name: "Ana",
      email: "ANA@MAIL.PE",
      phone: "987654321",
      password: "ClaveSegura123",
      confirmPassword: "ClaveSegura123",
      consent: true,
    };
    const parsed = registerSchema.safeParse(r);
    expect(parsed.success && parsed.data.email).toBe("ana@mail.pe");
    expect(
      registerSchema.safeParse({ ...r, password: "corta", confirmPassword: "corta" }).success,
    ).toBe(false);
    expect(registerSchema.safeParse({ ...r, confirmPassword: "Otra12345678" }).success).toBe(false);
  });
  it("valida consulta de seguimiento", () => {
    expect(trackingLookupSchema.safeParse({ code: "EZ-AAAA-BBBB", verifier: "x" }).success).toBe(
      false,
    );
  });
});

describe("formularios del panel", () => {
  it("convierte soles a céntimos y normaliza SKU", () => {
    const r = productSchema.safeParse({
      name: "SSD 1TB",
      sku: "ssd-1tb",
      brand: "X",
      categoryId: "c1",
      description: "Descripción suficiente",
      priceCents: "320.50",
      status: "ACTIVE",
      condition: "NEW",
    });
    expect(r.success && r.data.priceCents).toBe(32050);
    expect(r.success && r.data.sku).toBe("SSD-1TB");
    expect(
      productSchema.safeParse({
        name: "SSD",
        sku: "x y",
        brand: "X",
        categoryId: "c",
        description: "Descripción suficiente",
        priceCents: "0",
        status: "ACTIVE",
        condition: "NEW",
      }).success,
    ).toBe(false);
  });
  it("solo permite tipos de movimiento manuales", () => {
    expect(movementSchema.safeParse({ productId: "p", type: "SALE", quantity: "1" }).success).toBe(
      false,
    );
    expect(movementSchema.safeParse({ productId: "p", type: "ENTRY", quantity: "3" }).success).toBe(
      true,
    );
  });
});

describe("registro de producto con foto", () => {
  const base = {
    name: "SSD 1TB",
    sku: "ssd-1tb",
    brand: "X",
    categoryId: "c1",
    description: "Descripción suficiente",
    priceCents: "320",
    status: "DRAFT",
    condition: "NEW",
  };
  it("acepta stock inicial y normaliza las claves de fotos a una lista (máx. 4)", () => {
    const one = productSchema.parse({
      ...base,
      initialStock: "5",
      pendingImageKeys: "products/2026/a.jpg",
    });
    expect(one.initialStock).toBe(5);
    expect(one.pendingImageKeys).toEqual(["products/2026/a.jpg"]);
    const many = productSchema.parse({ ...base, pendingImageKeys: ["a", "b", "c", "d", "e"] });
    expect(many.pendingImageKeys).toHaveLength(4);
    expect(productSchema.parse(base).pendingImageKeys).toEqual([]);
  });
  it("rechaza stock inicial negativo", () => {
    expect(productSchema.safeParse({ ...base, initialStock: "-2" }).success).toBe(false);
  });
});
