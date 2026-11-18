import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { pcBuildSchema } from "@/lib/validations/public";
import { createPcBuildRequest } from "@/services/requests";

afterAll(() => db.$disconnect());

const base = {
  use: "GAMING",
  budget: "FROM_3500_5000",
  name: "Cliente PC",
  phone: "987654321",
  consent: "on",
};

describe("cotizar PC completa", () => {
  it("exige uso, presupuesto y consentimiento", () => {
    expect(pcBuildSchema.safeParse({ ...base, use: "" }).success).toBe(false);
    expect(pcBuildSchema.safeParse({ ...base, budget: undefined }).success).toBe(false);
    expect(pcBuildSchema.safeParse({ ...base, consent: undefined }).success).toBe(false);
  });

  it("acepta extras como texto, lista o ninguno y rechaza valores desconocidos", () => {
    expect(pcBuildSchema.parse({ ...base, extras: false }).extras).toEqual([]);
    expect(pcBuildSchema.parse({ ...base, extras: "monitor" }).extras).toEqual(["monitor"]);
    expect(pcBuildSchema.parse({ ...base, extras: ["mouse", "headset"] }).extras).toEqual([
      "mouse",
      "headset",
    ]);
    expect(pcBuildSchema.safeParse({ ...base, extras: ["impresora"] }).success).toBe(false);
  });

  it("guarda la solicitud con detalles estructurados y un resumen legible", async () => {
    const d = pcBuildSchema.parse({
      ...base,
      gpu: "NVIDIA",
      extras: ["monitor", "combo"],
      software: "Valorant, Fortnite",
    });
    const r = await createPcBuildRequest(d, null);
    const saved = await db.serviceRequest.findUniqueOrThrow({ where: { id: r.id } });
    expect(saved.kind).toBe("PC_BUILD");
    expect(saved.subject).toBe("PC gaming · S/ 3,500 – 5,000");
    expect(saved.message).toContain("Tarjeta de video: Dedicada NVIDIA GeForce");
    expect(saved.message).toContain("Incluir: Monitor, Combo 3 en 1");
    expect(saved.details).toMatchObject({
      use: "GAMING",
      gpu: "NVIDIA",
      extras: ["monitor", "combo"],
    });
    expect(saved.quotedPriceCents).toBeNull();
  });

  it("la base de datos rechaza un precio cotizado negativo", async () => {
    const r = await createPcBuildRequest(pcBuildSchema.parse(base), null);
    await expect(
      db.serviceRequest.update({ where: { id: r.id }, data: { quotedPriceCents: -1 } }),
    ).rejects.toThrow();
  });
});
