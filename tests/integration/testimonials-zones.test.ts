import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/checkout";
import { customerTestimonialSchema } from "@/lib/validations/public";
import { createOrder } from "@/services/orders";
import { getPublishedTestimonials, upsertCustomerTestimonial } from "@/services/testimonials";
import { checkout, makeProduct } from "./helpers";

afterAll(() => db.$disconnect());

const courier = {
  deliveryMethod: "COURIER" as const,
  line1: "Av. Prueba 123",
  district: "San Martín de Porres",
  province: "Lima",
  department: "Lima",
};

describe("zonas con costo «desde»", () => {
  it("no suma el monto referencial al total: el envío queda por cotizar", async () => {
    const zone = await db.deliveryZone.create({
      data: { name: `Zona desde ${randomUUID()}`, baseCostCents: 1500, costIsMinimum: true },
    });
    const p = await makeProduct(3, 20000);
    const o = await createOrder(
      checkoutSchema.parse(
        checkout([{ productId: p.id, quantity: 1 }], { ...courier, zoneId: zone.id }),
      ),
      null,
    );
    const saved = await db.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(saved.shippingCents).toBeNull();
    expect(o.totalCents).toBe(20000);
  });

  it("una zona con costo fijo sí lo suma", async () => {
    const zone = await db.deliveryZone.create({
      data: { name: `Zona fija ${randomUUID()}`, baseCostCents: 1500 },
    });
    const p = await makeProduct(3, 20000);
    const o = await createOrder(
      checkoutSchema.parse(
        checkout([{ productId: p.id, quantity: 1 }], { ...courier, zoneId: zone.id }),
      ),
      null,
    );
    const saved = await db.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(saved.shippingCents).toBe(1500);
    expect(o.totalCents).toBe(21500);
  });
});

describe("testimonios de clientes", () => {
  beforeAll(() =>
    db.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Cliente" },
    }),
  );
  const input = (content: string) =>
    customerTestimonialSchema.parse({
      authorName: "Carlos M.",
      rating: 5,
      content,
      consent: "on",
    });

  it("exige autorización expresa para publicar", () => {
    expect(
      customerTestimonialSchema.safeParse({
        authorName: "Ana",
        rating: 4,
        content: "Excelente atención y muy rápidos con mi laptop.",
      }).success,
    ).toBe(false);
  });

  it("queda pendiente, uno por cliente, y toda edición vuelve a revisión", async () => {
    const id = randomUUID();
    await db.user.create({ data: { id, email: `c-${id}@test.pe`, name: "Carlos Mendoza" } });

    const t1 = await upsertCustomerTestimonial(
      id,
      input("Muy buena atención, repararon mi PC rápido."),
    );
    expect(t1.approved).toBe(false);
    expect(t1.verified).toBe(false);
    expect(t1.consentAt).toBeInstanceOf(Date);
    expect((await getPublishedTestimonials(50)).some((t) => t.id === t1.id)).toBe(false);

    await db.testimonial.update({ where: { id: t1.id }, data: { approved: true } });
    expect((await getPublishedTestimonials(50)).some((t) => t.id === t1.id)).toBe(true);

    const t2 = await upsertCustomerTestimonial(
      id,
      input("Actualizo: también compré un SSD, todo ok."),
    );
    expect(t2.id).toBe(t1.id);
    expect(t2.approved).toBe(false);
    expect(await db.testimonial.count({ where: { userId: id } })).toBe(1);
  });

  it("marca como verificado a quien tiene un pedido completado", async () => {
    const id = randomUUID();
    await db.user.create({ data: { id, email: `v-${id}@test.pe`, name: "Lucía Ramos" } });
    const p = await makeProduct(2);
    const o = await createOrder(
      checkoutSchema.parse(
        checkout([{ productId: p.id, quantity: 1 }], { contactEmail: `v-${id}@test.pe` }),
      ),
      id,
    );
    await db.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
    const t = await upsertCustomerTestimonial(
      id,
      input("Compré un monitor y llegó perfecto, gracias."),
    );
    expect(t.verified).toBe(true);
  });
});
