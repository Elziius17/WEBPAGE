import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/checkout";
import { changeOrderStatus, createOrder, updateDeliveryStatus } from "@/services/orders";
import { checkout, makeAdmin, makeProduct } from "./helpers";

const parse = (x: unknown) => checkoutSchema.parse(x);

afterAll(() => db.$disconnect());

describe("pedidos e inventario (PostgreSQL real)", () => {
  it("toma el precio de la base de datos, no del cliente", async () => {
    const p = await makeProduct(5, 25000);
    const o = await createOrder(parse(checkout([{ productId: p.id, quantity: 2 }])), null);
    expect(o.totalCents).toBe(50000);
  });

  it("es idempotente: la misma clave no duplica el pedido", async () => {
    const p = await makeProduct(5);
    const data = parse(checkout([{ productId: p.id, quantity: 1 }]));
    const [a, b] = await Promise.all([createOrder(data, null), createOrder(data, null)]);
    expect(a.id).toBe(b.id);
    expect(await db.order.count({ where: { idempotencyKey: data.idempotencyKey } })).toBe(1);
  });

  it("no permite comprar sin stock ni más de lo disponible", async () => {
    const p = await makeProduct(0);
    await expect(
      createOrder(parse(checkout([{ productId: p.id, quantity: 1 }])), null),
    ).rejects.toThrow(/agotado/);
    const q = await makeProduct(2);
    await expect(
      createOrder(parse(checkout([{ productId: q.id, quantity: 3 }])), null),
    ).rejects.toThrow(/Solo quedan 2/);
  });

  it("reserva al confirmar, vende al completar y nunca deja stock negativo con confirmaciones concurrentes", async () => {
    const admin = await makeAdmin();
    const p = await makeProduct(3);
    const orders = await Promise.all(
      [1, 2, 3].map(() => createOrder(parse(checkout([{ productId: p.id, quantity: 2 }])), null)),
    );
    const results = await Promise.allSettled(
      orders.map((o) => changeOrderStatus({ orderId: o.id, to: "CONFIRMED", userId: admin.id })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1); // solo cabe una reserva de 2 en stock 3
    let prod = await db.product.findUniqueOrThrow({ where: { id: p.id } });
    expect(prod.reserved).toBe(2);
    const confirmed = orders[results.findIndex((r) => r.status === "fulfilled")]!;
    await changeOrderStatus({ orderId: confirmed.id, to: "COMPLETED", userId: admin.id });
    prod = await db.product.findUniqueOrThrow({ where: { id: p.id } });
    expect(prod).toMatchObject({ stock: 1, reserved: 0 });
    const movements = await db.inventoryMovement.findMany({
      where: { productId: p.id },
      orderBy: { createdAt: "asc" },
    });
    expect(movements.map((m) => m.type)).toEqual(["RESERVATION", "SALE"]);
    expect(movements.every((m) => m.userId === admin.id)).toBe(true);
  });

  it("libera la reserva al cancelar un pedido confirmado", async () => {
    const admin = await makeAdmin();
    const p = await makeProduct(4);
    const o = await createOrder(parse(checkout([{ productId: p.id, quantity: 3 }])), null);
    await changeOrderStatus({ orderId: o.id, to: "CONFIRMED", userId: admin.id });
    await changeOrderStatus({
      orderId: o.id,
      to: "CANCELLED",
      userId: admin.id,
      note: "Cliente desistió",
    });
    const prod = await db.product.findUniqueOrThrow({ where: { id: p.id } });
    expect(prod).toMatchObject({ stock: 4, reserved: 0 });
    await expect(
      changeOrderStatus({ orderId: o.id, to: "CONFIRMED", userId: admin.id }),
    ).rejects.toThrow(/no permitida/);
  });

  it("al registrar la entrega completa el pedido y descuenta stock (recojo)", async () => {
    const admin = await makeAdmin();
    const p = await makeProduct(2);
    const o = await createOrder(parse(checkout([{ productId: p.id, quantity: 1 }])), null);
    const d = await db.delivery.findUniqueOrThrow({ where: { orderId: o.id } });
    await expect(
      updateDeliveryStatus({ deliveryId: d.id, to: "READY_FOR_PICKUP", userId: admin.id }),
    ).rejects.toThrow();
    await changeOrderStatus({ orderId: o.id, to: "CONFIRMED", userId: admin.id });
    await updateDeliveryStatus({ deliveryId: d.id, to: "READY_FOR_PICKUP", userId: admin.id });
    await updateDeliveryStatus({ deliveryId: d.id, to: "DELIVERED", userId: admin.id });
    const order = await db.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(order.status).toBe("COMPLETED");
    expect((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(1);
  });

  it("la base de datos rechaza stock negativo aunque se salte la capa de servicio", async () => {
    const p = await makeProduct(1);
    await expect(db.product.update({ where: { id: p.id }, data: { stock: -1 } })).rejects.toThrow();
    await expect(
      db.product.update({ where: { id: p.id }, data: { reserved: 5 } }),
    ).rejects.toThrow();
  });
});
