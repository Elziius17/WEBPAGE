"use server";

import { revalidatePath } from "next/cache";
import { BusinessError, handleActionError, type ActionResult } from "@/lib/actions";
import { runAdminAction } from "@/lib/admin-action";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audit } from "@/lib/security/audit";
import { validateUpload } from "@/lib/security/file-validation";
import { buildKey, putObject } from "@/lib/storage";
import {
  courierSchema, deliveryStatusSchema, deliveryUpdateSchema, orderStatusSchema, paymentSchema, zoneSchema,
} from "@/lib/validations/admin";
import { changeOrderStatus, updateDeliveryStatus } from "@/services/orders";

type S = ActionResult<unknown> | null;
const refreshOrder = (id: string) => {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/entregas");
  revalidatePath("/admin/inventario");
};

export async function orderStatusAction(_: S, fd: FormData) {
  return runAdminAction("orders:write", orderStatusSchema, fd, async (d, user) => {
    await changeOrderStatus({ orderId: d.orderId, to: d.to, userId: user.id, note: d.note, shippingCents: d.shippingCents });
    refreshOrder(d.orderId);
    return { ok: true, message: "Pedido actualizado." };
  });
}

/**
 * Registra un pago VERIFICADO manualmente por el personal (con referencia de la operación).
 * La plataforma no procesa ni simula pagos.
 */
export async function registerPaymentAction(_: S, fd: FormData) {
  return runAdminAction("orders:write", paymentSchema, fd, async (d, user) => {
    const order = await db.order.findUnique({ where: { id: d.orderId }, include: { payments: true } });
    if (!order) throw new BusinessError("Pedido no encontrado.");
    if (order.status === "CANCELLED") throw new BusinessError("El pedido está cancelado.");
    const pending = order.payments.find((p) => p.status === "PENDING");
    const data = { method: d.method, amountCents: d.amountCents, reference: d.reference, notes: d.notes ?? null, status: "VERIFIED" as const, verifiedById: user.id, verifiedAt: new Date() };
    const pay = pending ? await db.payment.update({ where: { id: pending.id }, data }) : await db.payment.create({ data: { ...data, orderId: order.id } });
    await audit({ userId: user.id, action: "payment.verify", entity: "Order", entityId: order.id, after: { paymentId: pay.id, amountCents: d.amountCents, method: d.method } });
    const delivery = await db.delivery.findUnique({ where: { orderId: order.id } });
    if (delivery?.status === "PENDING_PAYMENT") {
      await updateDeliveryStatus({ deliveryId: delivery.id, to: "CONFIRMED", userId: user.id, description: "Pago verificado" });
    }
    refreshOrder(order.id);
    return { ok: true, message: "Pago verificado registrado." };
  });
}

export async function updateDeliveryAction(_: S, fd: FormData) {
  return runAdminAction("deliveries:write", deliveryUpdateSchema, fd, async ({ deliveryId, ...d }, user) => {
    const before = await db.delivery.findUnique({ where: { id: deliveryId } });
    if (!before) throw new BusinessError("Entrega no encontrada.");
    if (["DELIVERED", "CANCELLED"].includes(before.status)) throw new BusinessError("La entrega está cerrada.");
    const after = await db.delivery.update({
      where: { id: deliveryId },
      data: {
        courierId: d.courierId ?? null,
        zoneId: d.zoneId ?? null,
        trackingNumber: d.trackingNumber ?? null,
        costCents: d.costCents ?? null,
        weightGrams: d.weightGrams ?? null,
        lengthCm: d.lengthCm ?? null,
        widthCm: d.widthCm ?? null,
        heightCm: d.heightCm ?? null,
        pickupLocation: d.pickupLocation ?? null,
        scheduledAt: d.scheduledAt ?? null,
        receivedBy: d.receivedBy ?? null,
        notes: d.notes ?? null,
      },
    });
    // El costo de envío confirmado se refleja en el total del pedido mientras no esté completado.
    const order = await db.order.findUnique({ where: { id: before.orderId } });
    if (order && d.costCents !== undefined && !["COMPLETED", "CANCELLED"].includes(order.status)) {
      await db.order.update({ where: { id: order.id }, data: { shippingCents: d.costCents, totalCents: order.subtotalCents + d.costCents } });
    }
    await audit({ userId: user.id, action: "delivery.update", entity: "Delivery", entityId: deliveryId, before, after });
    refreshOrder(before.orderId);
    return { ok: true, message: "Datos de entrega guardados." };
  });
}

export async function deliveryStatusAction(_: S, fd: FormData) {
  return runAdminAction("deliveries:write", deliveryStatusSchema, fd, async (d, user) => {
    const delivery = await db.delivery.findUnique({ where: { id: d.deliveryId }, select: { orderId: true } });
    await updateDeliveryStatus({ deliveryId: d.deliveryId, to: d.to, userId: user.id, description: d.description, location: d.location });
    if (delivery) refreshOrder(delivery.orderId);
    return { ok: true, message: "Estado de entrega actualizado." };
  });
}

export async function uploadShippingProofAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("deliveries:write");
    const deliveryId = String(fd.get("deliveryId") ?? "");
    const delivery = await db.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new BusinessError("Entrega no encontrada.");
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) throw new BusinessError("Selecciona un archivo.");
    const check = await validateUpload(file, { allowPdf: true });
    if (!check.ok) throw new BusinessError(check.error);
    const key = buildKey("deliveries", check.ext);
    await putObject(key, check.bytes, check.mime);
    await db.attachment.create({ data: { kind: "SHIPPING_PROOF", storageKey: key, fileName: file.name.slice(0, 120), mimeType: check.mime, sizeBytes: file.size, deliveryId, uploadedById: user.id } });
    await audit({ userId: user.id, action: "delivery.proof", entity: "Delivery", entityId: deliveryId });
    refreshOrder(delivery.orderId);
    return { ok: true, message: "Comprobante adjuntado." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function saveCourierAction(_: S, fd: FormData) {
  return runAdminAction("deliveries:write", courierSchema, fd, async ({ id, ...d }, user) => {
    const data = { name: d.name, website: d.website ?? null, phone: d.phone ?? null, trackingUrlTemplate: d.trackingUrlTemplate ?? null, notes: d.notes ?? null, active: d.active };
    const c = id ? await db.courier.update({ where: { id }, data }) : await db.courier.create({ data });
    await audit({ userId: user.id, action: id ? "courier.update" : "courier.create", entity: "Courier", entityId: c.id, after: c });
    revalidatePath("/admin/entregas/configuracion");
  });
}

export async function saveZoneAction(_: S, fd: FormData) {
  return runAdminAction("deliveries:write", zoneSchema, fd, async ({ id, ...d }, user) => {
    const data = { name: d.name, description: d.description ?? null, baseCostCents: d.baseCostCents ?? null, estimatedTime: d.estimatedTime ?? null, active: d.active };
    const z = id ? await db.deliveryZone.update({ where: { id }, data }) : await db.deliveryZone.create({ data });
    await audit({ userId: user.id, action: id ? "zone.update" : "zone.create", entity: "DeliveryZone", entityId: z.id, after: z });
    revalidatePath("/admin/entregas/configuracion");
  });
}
