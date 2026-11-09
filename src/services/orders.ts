import "server-only";
import { db, type Tx } from "@/lib/db";
import { BusinessError } from "@/lib/actions";
import { generateOrderCode } from "@/lib/utils/codes";
import { audit } from "@/lib/security/audit";
import { applyMovement } from "./inventory";
import type { CheckoutData } from "@/lib/validations/checkout";
import type { OrderStatus, DeliveryStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

/** Transiciones permitidas del pedido comercial. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "READY", "COMPLETED", "CANCELLED"],
  PREPARING: ["READY", "COMPLETED", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Estados con stock reservado (la cancelación debe liberar). */
const RESERVED_STATES: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY"];

/** Agrupa ítems repetidos del carrito sumando cantidades. */
export function mergeCartItems(items: { productId: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  return [...map.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId)); // orden estable: evita interbloqueos
}

async function findOrCreateCustomer(
  tx: Tx,
  data: CheckoutData,
  userId: string | null,
): Promise<string> {
  if (userId) {
    const existing = await tx.customer.findUnique({ where: { userId } });
    if (existing) {
      await tx.customer.update({
        where: { id: existing.id },
        data: {
          phone: existing.phone || data.contactPhone,
          documentType: existing.documentType ?? data.documentType ?? null,
          documentNumber: existing.documentNumber ?? data.documentNumber ?? null,
        },
      });
      return existing.id;
    }
  }
  // Invitado: no se vincula a fichas existentes por seguridad (no hay verificación de identidad).
  const c = await tx.customer.create({
    data: {
      userId,
      fullName: data.contactName,
      email: data.contactEmail ?? null,
      phone: data.contactPhone,
      documentType: data.documentType ?? null,
      documentNumber: data.documentNumber ?? null,
      type: data.documentType === "RUC" ? "COMPANY" : "PERSON",
    },
  });
  return c.id;
}

export type CreatedOrder = { id: string; code: string; totalCents: number; duplicated: boolean };

/**
 * Crea un pedido validando todo en servidor:
 *  - Precios y stock se leen de la BD con bloqueo de fila (no se confía en el navegador).
 *  - La clave de idempotencia evita pedidos duplicados por doble envío.
 *  - El stock se verifica aquí y nuevamente al confirmar (cuando se reserva).
 */
export async function createOrder(
  data: CheckoutData,
  userId: string | null,
): Promise<CreatedOrder> {
  const existing = await db.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
  if (existing)
    return {
      id: existing.id,
      code: existing.code,
      totalCents: existing.totalCents,
      duplicated: true,
    };

  const items = mergeCartItems(data.items);

  try {
    return await db.$transaction(async (tx) => {
      const lines: {
        productId: string;
        productName: string;
        sku: string;
        unitPriceCents: number;
        quantity: number;
        lineTotalCents: number;
      }[] = [];

      for (const item of items) {
        const rows = await tx.$queryRaw<
          {
            id: string;
            name: string;
            sku: string;
            priceCents: number;
            stock: number;
            reserved: number;
            status: string;
            deletedAt: Date | null;
          }[]
        >`SELECT "id","name","sku","priceCents","stock","reserved","status","deletedAt" FROM "Product" WHERE "id" = ${item.productId} FOR UPDATE`;
        const p = rows[0];
        if (!p || p.deletedAt || p.status !== "ACTIVE")
          throw new BusinessError("Uno de los productos ya no está disponible.");
        const available = p.stock - p.reserved;
        if (available <= 0) throw new BusinessError(`"${p.name}" está agotado.`);
        if (item.quantity > available)
          throw new BusinessError(`Solo quedan ${available} unidad(es) de "${p.name}".`);
        lines.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          unitPriceCents: p.priceCents,
          quantity: item.quantity,
          lineTotalCents: p.priceCents * item.quantity,
        });
      }

      const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
      const customerId = await findOrCreateCustomer(tx, data, userId);

      let zoneId: string | null = null;
      let shippingCents: number | null = data.deliveryMethod === "PICKUP" ? 0 : null;
      if (data.deliveryMethod === "COURIER" && data.zoneId) {
        const zone = await tx.deliveryZone.findFirst({ where: { id: data.zoneId, active: true } });
        if (zone) {
          zoneId = zone.id;
          shippingCents = zone.baseCostCents ?? null; // null => ELZIIUS cotiza
        }
      }

      let addressId: string | null = null;
      if (data.deliveryMethod === "COURIER") {
        const addr = await tx.address.create({
          data: {
            customerId,
            recipientName: data.recipientName ?? data.contactName,
            phone: data.contactPhone,
            line1: data.line1!,
            line2: data.line2 ?? null,
            district: data.district!,
            province: data.province!,
            department: data.department!,
            reference: data.reference ?? null,
          },
        });
        addressId = addr.id;
      }

      const code = await uniqueOrderCode(tx);
      const order = await tx.order.create({
        data: {
          code,
          customerId,
          deliveryMethod: data.deliveryMethod,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + (shippingCents ?? 0),
          contactName: data.contactName,
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone,
          customerNotes: data.customerNotes ?? null,
          idempotencyKey: data.idempotencyKey,
          items: { create: lines },
          history: {
            create: { toStatus: "PENDING_CONFIRMATION", note: "Pedido registrado desde la tienda" },
          },
          payments: {
            create: {
              method: "WHATSAPP_COORDINATION",
              status: "PENDING",
              amountCents: subtotalCents + (shippingCents ?? 0),
            },
          },
          delivery: {
            create: {
              method: data.deliveryMethod,
              status: "PENDING_COORDINATION",
              recipientName: data.recipientName ?? data.contactName,
              recipientPhone: data.contactPhone,
              addressId,
              zoneId,
              costCents: shippingCents,
              tracking: {
                create: { status: "PENDING_COORDINATION", description: "Pedido registrado" },
              },
            },
          },
        },
      });
      await audit(
        {
          userId,
          action: "order.create",
          entity: "Order",
          entityId: order.id,
          after: { code, subtotalCents, items: lines.length },
        },
        tx,
      );
      return { id: order.id, code: order.code, totalCents: order.totalCents, duplicated: false };
    });
  } catch (err) {
    // Carrera con la misma clave de idempotencia: devolver el pedido ya creado.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const dup = await db.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (dup) return { id: dup.id, code: dup.code, totalCents: dup.totalCents, duplicated: true };
    }
    throw err;
  }
}

async function uniqueOrderCode(tx: Tx) {
  for (let i = 0; i < 5; i++) {
    const code = generateOrderCode();
    const clash = await tx.order.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return code;
  }
  throw new Error("No se pudo generar un código de pedido único");
}

/**
 * Cambia el estado de un pedido aplicando los efectos de inventario:
 *  - CONFIRMED: se verifica stock otra vez y se reserva.
 *  - COMPLETED: la reserva se convierte en venta (descuenta stock).
 *  - CANCELLED: libera reservas si existían.
 */
type ChangeOrderParams = {
  orderId: string;
  to: OrderStatus;
  userId: string;
  note?: string | null;
  shippingCents?: number | null;
};

export async function changeOrderStatus(params: ChangeOrderParams) {
  return db.$transaction((tx) => changeOrderStatusTx(tx, params));
}

export async function changeOrderStatusTx(tx: Tx, params: ChangeOrderParams) {
  {
    const locked = await tx.$queryRaw<{ id: string; status: OrderStatus }[]>`
      SELECT "id", "status" FROM "Order" WHERE "id" = ${params.orderId} FOR UPDATE`;
    const current = locked[0];
    if (!current) throw new BusinessError("Pedido no encontrado.");
    if (!canTransitionOrder(current.status, params.to))
      throw new BusinessError("Transición de estado no permitida para este pedido.");

    const order = await tx.order.findUniqueOrThrow({
      where: { id: params.orderId },
      include: { items: true, delivery: true },
    });

    if (params.to === "CONFIRMED") {
      for (const it of order.items) {
        await applyMovement(tx, {
          productId: it.productId,
          type: "RESERVATION",
          quantity: it.quantity,
          userId: params.userId,
          orderId: order.id,
          reference: order.code,
          reason: "Reserva por confirmación de pedido",
        });
      }
    }

    if (params.to === "COMPLETED") {
      const wasReserved = RESERVED_STATES.includes(current.status);
      for (const it of order.items) {
        if (!wasReserved)
          throw new BusinessError("El pedido debe confirmarse antes de completarse.");
        await applyMovement(tx, {
          productId: it.productId,
          type: "SALE",
          quantity: it.quantity,
          userId: params.userId,
          orderId: order.id,
          reference: order.code,
          reason: "Venta entregada",
        });
      }
      if (order.delivery && order.delivery.status !== "DELIVERED") {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
        await tx.shipmentTracking.create({
          data: {
            deliveryId: order.delivery.id,
            status: "DELIVERED",
            description: "Entrega confirmada",
            createdById: params.userId,
          },
        });
      }
    }

    if (params.to === "CANCELLED" && RESERVED_STATES.includes(current.status)) {
      for (const it of order.items) {
        await applyMovement(tx, {
          productId: it.productId,
          type: "RELEASE",
          quantity: it.quantity,
          userId: params.userId,
          orderId: order.id,
          reference: order.code,
          reason: "Liberación por cancelación",
        });
      }
    }
    if (params.to === "CANCELLED" && order.delivery) {
      await tx.delivery.update({ where: { id: order.delivery.id }, data: { status: "CANCELLED" } });
    }

    const data: Prisma.OrderUpdateInput = { status: params.to };
    if (params.to === "CONFIRMED") {
      data.confirmedAt = new Date();
      if (params.shippingCents !== undefined && params.shippingCents !== null) {
        data.shippingCents = params.shippingCents;
        data.totalCents = order.subtotalCents + params.shippingCents;
      }
      if (order.delivery && order.delivery.status === "PENDING_COORDINATION") {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: {
            status: "CONFIRMED",
            ...(params.shippingCents != null ? { costCents: params.shippingCents } : {}),
          },
        });
        await tx.shipmentTracking.create({
          data: {
            deliveryId: order.delivery.id,
            status: "CONFIRMED",
            description: "Pedido confirmado",
            createdById: params.userId,
          },
        });
      }
    }
    if (params.to === "COMPLETED") data.completedAt = new Date();
    if (params.to === "CANCELLED") {
      data.cancelledAt = new Date();
      data.cancelReason = params.note ?? null;
    }

    await tx.order.update({ where: { id: order.id }, data });
    await tx.orderHistory.create({
      data: {
        orderId: order.id,
        fromStatus: current.status,
        toStatus: params.to,
        note: params.note ?? null,
        userId: params.userId,
      },
    });
    await audit(
      {
        userId: params.userId,
        action: "order.status",
        entity: "Order",
        entityId: order.id,
        before: { status: current.status },
        after: { status: params.to },
      },
      tx,
    );
  }
}

/** Transiciones de entrega permitidas (gestión manual). */
export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING_COORDINATION: ["PENDING_PAYMENT", "CONFIRMED", "INCIDENT", "CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "INCIDENT", "CANCELLED"],
  CONFIRMED: ["PREPARING", "READY_FOR_PICKUP", "DISPATCHED", "INCIDENT", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "DISPATCHED", "INCIDENT", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "INCIDENT", "CANCELLED"],
  DISPATCHED: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "INCIDENT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "INCIDENT"],
  OUT_FOR_DELIVERY: ["DELIVERED", "INCIDENT"],
  DELIVERED: [],
  INCIDENT: [
    "PREPARING",
    "READY_FOR_PICKUP",
    "DISPATCHED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ],
  CANCELLED: [],
};

export function allowedDeliveryTransitions(method: "PICKUP" | "COURIER", from: DeliveryStatus) {
  const courierOnly: DeliveryStatus[] = ["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"];
  const pickupOnly: DeliveryStatus[] = ["READY_FOR_PICKUP"];
  return DELIVERY_TRANSITIONS[from].filter((s) =>
    method === "PICKUP" ? !courierOnly.includes(s) : !pickupOnly.includes(s),
  );
}

/** Actualiza el estado de la entrega; al marcar ENTREGADO completa el pedido (venta). */
export async function updateDeliveryStatus(params: {
  deliveryId: string;
  to: DeliveryStatus;
  userId: string;
  description?: string | null;
  location?: string | null;
}) {
  const delivery = await db.delivery.findUnique({
    where: { id: params.deliveryId },
    include: { order: true },
  });
  if (!delivery) throw new BusinessError("Entrega no encontrada.");
  if (!allowedDeliveryTransitions(delivery.method, delivery.status).includes(params.to))
    throw new BusinessError("Transición de entrega no permitida.");
  if (params.to === "DELIVERED") {
    if (!["CONFIRMED", "PREPARING", "READY"].includes(delivery.order.status))
      throw new BusinessError("Confirma el pedido antes de registrar la entrega.");
    if (delivery.method === "COURIER" && !delivery.trackingNumber)
      throw new BusinessError("Registra el número de guía antes de marcar como entregado.");
  }
  if (params.to === "DISPATCHED" && !delivery.courierId)
    throw new BusinessError("Asigna un courier antes de despachar.");

  await db.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        status: params.to,
        ...(params.to === "DISPATCHED" ? { dispatchedAt: new Date() } : {}),
        ...(params.to === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(params.to === "INCIDENT" ? { incidentNotes: params.description ?? null } : {}),
      },
    });
    await tx.shipmentTracking.create({
      data: {
        deliveryId: delivery.id,
        status: params.to,
        description: params.description ?? null,
        location: params.location ?? null,
        createdById: params.userId,
      },
    });
    await audit(
      {
        userId: params.userId,
        action: "delivery.status",
        entity: "Delivery",
        entityId: delivery.id,
        before: { status: delivery.status },
        after: { status: params.to },
      },
      tx,
    );
    if (params.to === "DELIVERED") {
      await changeOrderStatusTx(tx, {
        orderId: delivery.orderId,
        to: "COMPLETED",
        userId: params.userId,
        note: "Entrega registrada",
      });
    }
  });
}
