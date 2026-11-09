import { describe, expect, it } from "vitest";
import { allowedDeliveryTransitions, canTransitionOrder, mergeCartItems } from "@/services/orders";

describe("pedidos", () => {
  it("agrupa ítems repetidos y ordena de forma estable", () => {
    expect(
      mergeCartItems([
        { productId: "b", quantity: 1 },
        { productId: "a", quantity: 2 },
        { productId: "b", quantity: 3 },
      ]),
    ).toEqual([
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 4 },
    ]);
  });
  it("respeta las transiciones de estado", () => {
    expect(canTransitionOrder("PENDING_CONFIRMATION", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("PENDING_CONFIRMATION", "COMPLETED")).toBe(false);
    expect(canTransitionOrder("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransitionOrder("CANCELLED", "CONFIRMED")).toBe(false);
  });
  it("filtra estados de entrega según la modalidad", () => {
    expect(allowedDeliveryTransitions("PICKUP", "CONFIRMED")).not.toContain("DISPATCHED");
    expect(allowedDeliveryTransitions("PICKUP", "CONFIRMED")).toContain("READY_FOR_PICKUP");
    expect(allowedDeliveryTransitions("COURIER", "CONFIRMED")).not.toContain("READY_FOR_PICKUP");
    expect(allowedDeliveryTransitions("COURIER", "DELIVERED")).toEqual([]);
  });
});
