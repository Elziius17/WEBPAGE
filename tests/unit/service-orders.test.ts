import { describe, expect, it } from "vitest";
import { canTransitionService, checkServiceGuards } from "@/services/service-orders";

const ctx = (o: Partial<Parameters<typeof checkServiceGuards>[1]> = {}) => ({
  approvals: [],
  quality: [],
  diagnoses: [],
  ...o,
});
const t = (s: number) => new Date(2026, 0, 1, 0, 0, s);

describe("máquina de estados de órdenes técnicas", () => {
  it("permite el flujo principal", () => {
    expect(canTransitionService("RECEIVED", "IN_DIAGNOSIS")).toBe(true);
    expect(canTransitionService("APPROVED", "IN_REPAIR")).toBe(true);
    expect(canTransitionService("IN_TESTING", "READY_FOR_DELIVERY")).toBe(true);
  });
  it("no permite saltar a reparación desde la recepción ni reabrir órdenes cerradas", () => {
    expect(canTransitionService("RECEIVED", "IN_REPAIR")).toBe(false);
    expect(canTransitionService("DELIVERED", "IN_REPAIR")).toBe(false);
    expect(canTransitionService("CANCELLED", "RECEIVED")).toBe(false);
  });
});

describe("reglas de negocio", () => {
  it("no se repara sin autorización aprobada", () => {
    expect(checkServiceGuards("IN_REPAIR", ctx())).toMatch(/autorización/);
    expect(
      checkServiceGuards(
        "APPROVED",
        ctx({ approvals: [{ decision: "PENDING", createdAt: t(1) }] }),
      ),
    ).toMatch(/autorización/);
    expect(
      checkServiceGuards(
        "IN_REPAIR",
        ctx({ approvals: [{ decision: "APPROVED", createdAt: t(1) }] }),
      ),
    ).toBeNull();
  });
  it("usa la aprobación más reciente", () => {
    const approvals = [
      { decision: "APPROVED" as const, createdAt: t(1) },
      { decision: "PENDING" as const, createdAt: t(2) },
    ];
    expect(checkServiceGuards("IN_REPAIR", ctx({ approvals }))).not.toBeNull();
  });
  it("exige control de calidad aprobado para marcar listo, salvo rechazo del presupuesto", () => {
    expect(checkServiceGuards("READY_FOR_DELIVERY", ctx())).toMatch(/control de calidad/);
    expect(
      checkServiceGuards(
        "READY_FOR_DELIVERY",
        ctx({ quality: [{ passed: false, performedAt: t(1) }] }),
      ),
    ).not.toBeNull();
    expect(
      checkServiceGuards(
        "READY_FOR_DELIVERY",
        ctx({ quality: [{ passed: true, performedAt: t(1) }] }),
      ),
    ).toBeNull();
    expect(
      checkServiceGuards(
        "READY_FOR_DELIVERY",
        ctx({ approvals: [{ decision: "REJECTED", createdAt: t(1) }] }),
      ),
    ).toBeNull();
  });
  it("exige diagnóstico y presupuesto antes de 'presupuesto enviado'", () => {
    expect(checkServiceGuards("QUOTE_SENT", ctx())).toMatch(/diagnóstico/);
    expect(checkServiceGuards("QUOTE_SENT", ctx({ diagnoses: [{ id: "d" }] }))).toMatch(
      /presupuesto/,
    );
  });
});
