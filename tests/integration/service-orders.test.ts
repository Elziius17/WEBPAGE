import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  addDiagnosis,
  addQualityChecklist,
  addRepairTask,
  addReplacementPart,
  closeServiceOrder,
  createServiceOrder,
  findPublicTracking,
  recordApprovalDecision,
  sendQuote,
  transitionServiceOrder,
} from "@/services/service-orders";
import { makeAdmin, makeProduct } from "./helpers";

afterAll(() => db.$disconnect());

describe("ciclo de una orden de servicio", () => {
  it("cumple el flujo completo con reglas y trazabilidad", async () => {
    const admin = await makeAdmin();
    const part = await makeProduct(2);
    const o = await createServiceOrder(
      {
        customer: { fullName: "María Técnica", phone: "955 000 111", email: "maria@test.pe" },
        deviceType: "LAPTOP",
        brand: "HP",
        reportedIssue: "No enciende",
        accessProvided: false,
        dataBackupAuthorized: false,
        deliveryMode: "PICKUP_AT_STORE",
        internalNotes: "Cliente frecuente — NOTA INTERNA",
      },
      admin,
    );
    expect(o.code).toMatch(/^EZ-/);

    await addDiagnosis(admin, o.id, {
      findings: "Placa",
      technicalDiagnosis: "Cortocircuito en MOSFET — DETALLE TÉCNICO",
      publicSummary: "Requiere reparación de placa.",
    });
    const q = await sendQuote(admin, o.id, {
      budgetCents: 15000,
      description: "Reparación de placa",
    });
    await expect(
      transitionServiceOrder({ user: admin, orderId: o.id, to: "APPROVED" }),
    ).rejects.toThrow(/autorización/);
    await expect(addRepairTask(admin, o.id, { description: "x" })).rejects.toThrow();

    await recordApprovalDecision(admin, q.id, { decision: "APPROVED", evidence: "WhatsApp" });
    await expect(
      recordApprovalDecision(admin, q.id, { decision: "REJECTED", evidence: "x" }),
    ).rejects.toThrow(/ya tiene/);
    await addRepairTask(admin, o.id, { description: "Cambio de MOSFET" });
    await addReplacementPart(admin, o.id, {
      name: "",
      quantity: 1,
      productId: part.id,
      fromInventory: true,
    });
    expect((await db.product.findUniqueOrThrow({ where: { id: part.id } })).stock).toBe(1);

    await expect(
      transitionServiceOrder({ user: admin, orderId: o.id, to: "READY_FOR_DELIVERY" }),
    ).rejects.toThrow();
    await addQualityChecklist(admin, o.id, { items: [{ label: "Encendido", result: "FAIL" }] });
    await expect(
      transitionServiceOrder({ user: admin, orderId: o.id, to: "READY_FOR_DELIVERY" }),
    ).rejects.toThrow(/control de calidad/);
    await addQualityChecklist(admin, o.id, { items: [{ label: "Encendido", result: "PASS" }] });
    await transitionServiceOrder({ user: admin, orderId: o.id, to: "READY_FOR_DELIVERY" });
    await closeServiceOrder(admin, o.id, {
      finalResult: "Operativo",
      customerConformity: true,
      warrantyDays: 30,
    });

    const final = await db.serviceOrder.findUniqueOrThrow({
      where: { id: o.id },
      include: { history: true },
    });
    expect(final.status).toBe("DELIVERED");
    expect(final.history.every((h) => h.userId === admin.id)).toBe(true);
    expect(final.history.length).toBeGreaterThan(6);

    // Seguimiento público: requiere verificador correcto y no expone datos internos.
    expect(await findPublicTracking(o.code, "otro@test.pe")).toBeNull();
    expect(await findPublicTracking(o.code.toLowerCase(), "maria@test.pe")).not.toBeNull();
    const pub = await findPublicTracking(o.code, "955000111");
    const json = JSON.stringify(pub);
    expect(json).not.toMatch(/NOTA INTERNA|DETALLE TÉCNICO|maria@test\.pe|955/);
    expect(pub?.diagnosisSummary).toBe("Requiere reparación de placa.");
  });

  it("un técnico no accede a órdenes que no tiene asignadas", async () => {
    const admin = await makeAdmin();
    const o = await createServiceOrder(
      {
        customer: { fullName: "X", phone: "999888777" },
        deviceType: "DESKTOP",
        brand: "Dell",
        reportedIssue: "Lento",
        accessProvided: false,
        dataBackupAuthorized: false,
        deliveryMode: "PICKUP_AT_STORE",
      },
      admin,
    );
    const tech = { ...admin, role: "TECHNICIAN" as const };
    await expect(
      transitionServiceOrder({ user: tech, orderId: o.id, to: "IN_DIAGNOSIS" }),
    ).rejects.toThrow(/sin acceso/);
  });
});
