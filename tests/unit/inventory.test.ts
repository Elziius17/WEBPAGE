import { describe, expect, it } from "vitest";
import { computeMovement } from "@/services/inventory";

const p = (stock: number, reserved = 0) => ({ stock, reserved });

describe("computeMovement — reglas de inventario", () => {
  it("una entrada suma stock", () => {
    expect(computeMovement(p(5), "ENTRY", 3)).toEqual({ stockDelta: 3, reservedDelta: 0 });
  });
  it("una salida no puede superar el stock disponible (stock - reservado)", () => {
    expect(() => computeMovement(p(5, 3), "EXIT", 3)).toThrow(/disponible: 2/);
    expect(computeMovement(p(5, 3), "EXIT", 2)).toEqual({ stockDelta: -2, reservedDelta: 0 });
  });
  it("la reserva no modifica el stock físico y respeta disponibilidad", () => {
    expect(computeMovement(p(4, 1), "RESERVATION", 3)).toEqual({ stockDelta: 0, reservedDelta: 3 });
    expect(() => computeMovement(p(4, 1), "RESERVATION", 4)).toThrow();
  });
  it("la liberación no puede exceder lo reservado", () => {
    expect(computeMovement(p(4, 2), "RELEASE", 2)).toEqual({ stockDelta: 0, reservedDelta: -2 });
    expect(() => computeMovement(p(4, 2), "RELEASE", 3)).toThrow();
  });
  it("la venta descuenta stock y reserva a la vez", () => {
    expect(computeMovement(p(4, 2), "SALE", 2)).toEqual({ stockDelta: -2, reservedDelta: -2 });
    expect(() => computeMovement(p(4, 0), "SALE", 1)).toThrow();
  });
  it("el ajuste fija el conteo físico y no puede quedar por debajo de lo reservado", () => {
    expect(computeMovement(p(10, 2), "ADJUSTMENT", 7)).toEqual({
      stockDelta: -3,
      reservedDelta: 0,
    });
    expect(() => computeMovement(p(10, 2), "ADJUSTMENT", 1)).toThrow(/reservadas/);
  });
  it("rechaza cantidades inválidas", () => {
    expect(() => computeMovement(p(1), "ENTRY", 0)).toThrow();
    expect(() => computeMovement(p(1), "ENTRY", -1)).toThrow();
    expect(() => computeMovement(p(1), "ENTRY", 1.5)).toThrow();
  });
  it("nunca produce inventario negativo", () => {
    const types = [
      "ENTRY",
      "EXIT",
      "ADJUSTMENT",
      "RESERVATION",
      "RELEASE",
      "SALE",
      "RETURN",
      "SERVICE_USE",
    ] as const;
    for (let stock = 0; stock < 5; stock++)
      for (let reserved = 0; reserved <= stock; reserved++)
        for (const t of types)
          for (let q = 0; q < 7; q++) {
            try {
              const r = computeMovement({ stock, reserved }, t, q);
              const s = stock + r.stockDelta;
              const res = reserved + r.reservedDelta;
              expect(s).toBeGreaterThanOrEqual(0);
              expect(res).toBeGreaterThanOrEqual(0);
              expect(res).toBeLessThanOrEqual(s);
            } catch {
              // rechazado: correcto
            }
          }
  });
});
