import "server-only";
import { db, type Tx } from "@/lib/db";
import { BusinessError } from "@/lib/actions";
import { generateTrackingCode, normalizeCode } from "@/lib/utils/codes";
import { phonesMatch } from "@/lib/utils/phone";
import { audit } from "@/lib/security/audit";
import { hasPermission } from "@/lib/security/permissions";
import type { CurrentUser } from "@/lib/auth/session";
import { applyMovement } from "./inventory";
import type { Prisma } from "@/generated/prisma/client";
import type { ServiceOrderStatus, DeviceType, ServiceDeliveryMode, CheckResult } from "@/generated/prisma/enums";

/** Máquina de estados de la orden de servicio técnico. */
export const SERVICE_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  REQUESTED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["IN_DIAGNOSIS", "CANCELLED"],
  IN_DIAGNOSIS: ["QUOTE_SENT", "APPROVED", "CANCELLED"],
  QUOTE_SENT: ["PENDING_APPROVAL", "APPROVED", "READY_FOR_DELIVERY", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "READY_FOR_DELIVERY", "CANCELLED"],
  APPROVED: ["IN_REPAIR", "CANCELLED"],
  IN_REPAIR: ["IN_TESTING", "PENDING_APPROVAL", "CANCELLED"],
  IN_TESTING: ["IN_REPAIR", "READY_FOR_DELIVERY"],
  READY_FOR_DELIVERY: ["DELIVERED", "IN_REPAIR"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionService(from: ServiceOrderStatus, to: ServiceOrderStatus) {
  return SERVICE_TRANSITIONS[from].includes(to);
}

type GuardContext = {
  approvals: { decision: "PENDING" | "APPROVED" | "REJECTED"; createdAt: Date }[];
  quality: { passed: boolean; performedAt: Date }[];
  diagnoses: { id: string }[];
};

/**
 * Reglas de negocio adicionales a la máquina de estados:
 *  - No se repara sin una autorización APROBADA registrada.
 *  - No se marca "listo para entrega" sin control de calidad aprobado
 *    (salvo que el cliente haya rechazado el presupuesto: se devuelve sin reparar).
 */
export function checkServiceGuards(to: ServiceOrderStatus, ctx: GuardContext): string | null {
  const latestApproval = [...ctx.approvals].sort((a, b) => +b.createdAt - +a.createdAt)[0];
  const latestQc = [...ctx.quality].sort((a, b) => +b.performedAt - +a.performedAt)[0];
  if (to === "QUOTE_SENT" && ctx.diagnoses.length === 0) return "Registra un diagnóstico antes de enviar el presupuesto.";
  if (to === "QUOTE_SENT" && !latestApproval) return "Registra el presupuesto presentado al cliente.";
  if ((to === "APPROVED" || to === "IN_REPAIR") && latestApproval?.decision !== "APPROVED")
    return "No se puede reparar sin la autorización del cliente registrada.";
  if (to === "READY_FOR_DELIVERY") {
    const rejected = latestApproval?.decision === "REJECTED";
    if (!rejected && !latestQc?.passed) return "Registra un control de calidad aprobado antes de marcar listo para entrega.";
  }
  return null;
}

async function uniqueTrackingCode(tx: Tx) {
  for (let i = 0; i < 5; i++) {
    const code = generateTrackingCode();
    const clash = await tx.serviceOrder.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return code;
  }
  throw new Error("No se pudo generar un código de seguimiento único");
}

/** Filtro de visibilidad: un técnico solo ve sus órdenes asignadas. */
export async function serviceOrderScope(user: CurrentUser): Promise<Prisma.ServiceOrderWhereInput> {
  if (hasPermission(user.role, "service-orders:read-all")) return {};
  const tech = await db.technician.findUnique({ where: { userId: user.id }, select: { id: true } });
  return { technicianId: tech?.id ?? "__none__" };
}

/** Carga una orden verificando que el usuario tenga acceso a ella. */
export async function getAccessibleOrder(user: CurrentUser, orderId: string) {
  const scope = await serviceOrderScope(user);
  const order = await db.serviceOrder.findFirst({ where: { id: orderId, ...scope }, select: { id: true, status: true, code: true } });
  if (!order) throw new BusinessError("Orden no encontrada o sin acceso.");
  return order;
}

export type ReceptionInput = {
  customerId?: string;
  customer?: { fullName: string; phone: string; email?: string; documentType?: "DNI" | "RUC" | "CE" | "PASSPORT"; documentNumber?: string };
  serviceId?: string;
  technicianId?: string;
  deviceType: DeviceType;
  brand: string;
  model?: string;
  serialNumber?: string;
  accessories?: string;
  physicalCondition?: string;
  reportedIssue: string;
  accessProvided: boolean;
  dataBackupAuthorized: boolean;
  deliveryMode: ServiceDeliveryMode;
  estimatedReadyAt?: Date;
  publicNotes?: string;
  internalNotes?: string;
  receivedAt?: Date;
};

export async function createServiceOrder(input: ReceptionInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    let customerId = input.customerId;
    if (customerId) {
      const c = await tx.customer.findFirst({ where: { id: customerId, deletedAt: null } });
      if (!c) throw new BusinessError("Cliente no encontrado.");
    } else if (input.customer) {
      const c = await tx.customer.create({
        data: {
          fullName: input.customer.fullName,
          phone: input.customer.phone,
          email: input.customer.email ?? null,
          documentType: input.customer.documentType ?? null,
          documentNumber: input.customer.documentNumber ?? null,
          type: input.customer.documentType === "RUC" ? "COMPANY" : "PERSON",
        },
      });
      customerId = c.id;
    } else throw new BusinessError("Selecciona o registra un cliente.");

    const code = await uniqueTrackingCode(tx);
    const order = await tx.serviceOrder.create({
      data: {
        code,
        status: "RECEIVED",
        customerId,
        serviceId: input.serviceId ?? null,
        technicianId: input.technicianId ?? null,
        deviceType: input.deviceType,
        brand: input.brand,
        model: input.model ?? null,
        serialNumber: input.serialNumber ?? null,
        accessories: input.accessories ?? null,
        physicalCondition: input.physicalCondition ?? null,
        reportedIssue: input.reportedIssue,
        accessProvided: input.accessProvided,
        dataBackupAuthorized: input.dataBackupAuthorized,
        deliveryMode: input.deliveryMode,
        estimatedReadyAt: input.estimatedReadyAt ?? null,
        publicNotes: input.publicNotes ?? null,
        internalNotes: input.internalNotes ?? null,
        receivedAt: input.receivedAt ?? new Date(),
        createdById: user.id,
        history: {
          create: { toStatus: "RECEIVED", note: "Equipo recibido en ELZIIUS", isPublic: true, userId: user.id },
        },
      },
    });
    await audit({ userId: user.id, action: "service-order.create", entity: "ServiceOrder", entityId: order.id, after: { code } }, tx);
    return order;
  });
}

export async function transitionServiceOrder(params: {
  user: CurrentUser;
  orderId: string;
  to: ServiceOrderStatus;
  note?: string;
  isPublic?: boolean;
}) {
  await getAccessibleOrder(params.user, params.orderId);
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ status: ServiceOrderStatus }[]>`
      SELECT "status" FROM "ServiceOrder" WHERE "id" = ${params.orderId} FOR UPDATE`;
    const from = locked[0]?.status;
    if (!from) throw new BusinessError("Orden no encontrada.");
    if (!canTransitionService(from, params.to)) throw new BusinessError("Transición de estado no permitida.");
    const ctx = await tx.serviceOrder.findUniqueOrThrow({
      where: { id: params.orderId },
      select: {
        approvals: { select: { decision: true, createdAt: true } },
        quality: { select: { passed: true, performedAt: true } },
        diagnoses: { select: { id: true } },
      },
    });
    const guard = checkServiceGuards(params.to, ctx);
    if (guard) throw new BusinessError(guard);

    const now = new Date();
    await tx.serviceOrder.update({
      where: { id: params.orderId },
      data: {
        status: params.to,
        ...(params.to === "READY_FOR_DELIVERY" ? { completedAt: now } : {}),
        ...(params.to === "DELIVERED" ? { deliveredAt: now } : {}),
        ...(params.to === "CANCELLED" ? { cancelledAt: now, cancelReason: params.note ?? null } : {}),
      },
    });
    await tx.serviceOrderHistory.create({
      data: {
        orderId: params.orderId,
        fromStatus: from,
        toStatus: params.to,
        note: params.note ?? null,
        isPublic: params.isPublic ?? true,
        userId: params.user.id,
      },
    });
    await audit(
      { userId: params.user.id, action: "service-order.status", entity: "ServiceOrder", entityId: params.orderId, before: { status: from }, after: { status: params.to } },
      tx,
    );
  });
}

export async function addHistoryNote(user: CurrentUser, orderId: string, note: string, isPublic: boolean) {
  await getAccessibleOrder(user, orderId);
  await db.serviceOrderHistory.create({ data: { orderId, note, isPublic, userId: user.id } });
}

export async function addDiagnosis(
  user: CurrentUser,
  orderId: string,
  data: {
    findings: string;
    testsPerformed?: string;
    affectedComponents?: string;
    technicalDiagnosis: string;
    publicSummary?: string;
    budgetCents?: number;
    estimatedTime?: string;
    recommendations?: string;
  },
) {
  const order = await getAccessibleOrder(user, orderId);
  return db.$transaction(async (tx) => {
    const d = await tx.diagnosis.create({ data: { orderId, userId: user.id, ...data } });
    if (order.status === "RECEIVED") {
      await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "IN_DIAGNOSIS" } });
      await tx.serviceOrderHistory.create({
        data: { orderId, fromStatus: "RECEIVED", toStatus: "IN_DIAGNOSIS", note: "Diagnóstico en curso", userId: user.id },
      });
    }
    await tx.serviceOrderHistory.create({
      data: { orderId, note: data.publicSummary ? `Diagnóstico: ${data.publicSummary}` : "Diagnóstico técnico registrado", isPublic: true, userId: user.id },
    });
    await audit({ userId: user.id, action: "service-order.diagnosis", entity: "ServiceOrder", entityId: orderId, after: { diagnosisId: d.id } }, tx);
    return d;
  });
}

/** Registra el presupuesto presentado al cliente y pasa a PRESUPUESTO ENVIADO. */
export async function sendQuote(
  user: CurrentUser,
  orderId: string,
  data: { budgetCents: number; description: string; sentVia?: string; diagnosisId?: string },
) {
  const order = await getAccessibleOrder(user, orderId);
  if (!["IN_DIAGNOSIS", "IN_REPAIR", "QUOTE_SENT", "PENDING_APPROVAL"].includes(order.status))
    throw new BusinessError("El presupuesto se registra tras el diagnóstico.");
  return db.$transaction(async (tx) => {
    const diagnoses = await tx.diagnosis.count({ where: { orderId } });
    if (!diagnoses) throw new BusinessError("Registra un diagnóstico antes del presupuesto.");
    const pending = await tx.serviceApproval.findFirst({ where: { orderId, decision: "PENDING" } });
    if (pending) throw new BusinessError("Ya existe un presupuesto pendiente de respuesta.");
    const a = await tx.serviceApproval.create({
      data: {
        orderId,
        budgetCents: data.budgetCents,
        description: data.description,
        sentVia: data.sentVia ?? null,
        diagnosisId: data.diagnosisId ?? null,
        recordedById: user.id,
      },
    });
    const to: ServiceOrderStatus = order.status === "IN_REPAIR" ? "PENDING_APPROVAL" : "QUOTE_SENT";
    if (order.status !== to) {
      await tx.serviceOrder.update({ where: { id: orderId }, data: { status: to } });
      await tx.serviceOrderHistory.create({
        data: {
          orderId,
          fromStatus: order.status as ServiceOrderStatus,
          toStatus: to,
          note: to === "PENDING_APPROVAL" ? "Presupuesto adicional enviado para aprobación" : "Presupuesto enviado al cliente",
          userId: user.id,
        },
      });
    }
    await audit({ userId: user.id, action: "service-order.quote", entity: "ServiceOrder", entityId: orderId, after: { approvalId: a.id, budgetCents: data.budgetCents } }, tx);
    return a;
  });
}

/** Registra la respuesta del cliente al presupuesto con su evidencia. */
export async function recordApprovalDecision(
  user: CurrentUser,
  approvalId: string,
  data: { decision: "APPROVED" | "REJECTED"; evidence: string; respondedAt?: Date },
) {
  const approval = await db.serviceApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new BusinessError("Presupuesto no encontrado.");
  const order = await getAccessibleOrder(user, approval.orderId);
  if (approval.decision !== "PENDING") throw new BusinessError("Este presupuesto ya tiene una respuesta registrada.");
  return db.$transaction(async (tx) => {
    await tx.serviceApproval.update({
      where: { id: approvalId },
      data: { decision: data.decision, evidence: data.evidence, respondedAt: data.respondedAt ?? new Date(), recordedById: user.id },
    });
    const to: ServiceOrderStatus | null =
      data.decision === "APPROVED" ? (order.status === "PENDING_APPROVAL" && (await wasInRepair(tx, order.id)) ? "IN_REPAIR" : "APPROVED") : null;
    if (to && order.status !== to) {
      await tx.serviceOrder.update({ where: { id: order.id }, data: { status: to } });
    }
    await tx.serviceOrderHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status as ServiceOrderStatus,
        toStatus: to ?? (order.status as ServiceOrderStatus),
        note: data.decision === "APPROVED" ? "El cliente aprobó el presupuesto" : "El cliente no aprobó el presupuesto",
        userId: user.id,
      },
    });
    await audit({ userId: user.id, action: "service-order.approval", entity: "ServiceOrder", entityId: order.id, after: { approvalId, decision: data.decision } }, tx);
  });
}

async function wasInRepair(tx: Tx, orderId: string) {
  const h = await tx.serviceOrderHistory.findFirst({ where: { orderId, toStatus: "IN_REPAIR" } });
  return !!h;
}

export async function addRepairTask(user: CurrentUser, orderId: string, data: { description: string; notes?: string }) {
  const order = await getAccessibleOrder(user, orderId);
  if (!["APPROVED", "IN_REPAIR", "IN_TESTING"].includes(order.status))
    throw new BusinessError("Solo se registran actividades en órdenes aprobadas.");
  return db.$transaction(async (tx) => {
    const t = await tx.repairTask.create({ data: { orderId, userId: user.id, ...data } });
    if (order.status === "APPROVED") {
      await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "IN_REPAIR" } });
      await tx.serviceOrderHistory.create({
        data: { orderId, fromStatus: "APPROVED", toStatus: "IN_REPAIR", note: "Reparación iniciada", userId: user.id },
      });
    }
    return t;
  });
}

export async function addReplacementPart(
  user: CurrentUser,
  orderId: string,
  data: { name: string; quantity: number; productId?: string; unitPriceCents?: number; serialNumber?: string; fromInventory: boolean; repairTaskId?: string },
) {
  const order = await getAccessibleOrder(user, orderId);
  if (!["APPROVED", "IN_REPAIR", "IN_TESTING"].includes(order.status))
    throw new BusinessError("Solo se registran repuestos en órdenes aprobadas.");
  return db.$transaction(async (tx) => {
    let name = data.name;
    if (data.fromInventory) {
      if (!data.productId) throw new BusinessError("Selecciona el producto del inventario.");
      const mv = await applyMovement(tx, {
        productId: data.productId,
        type: "SERVICE_USE",
        quantity: data.quantity,
        userId: user.id,
        serviceOrderId: orderId,
        reference: order.code,
        reason: "Repuesto utilizado en servicio técnico",
      });
      const p = await tx.product.findUnique({ where: { id: mv.productId }, select: { name: true } });
      name = name || p?.name || "Repuesto";
    }
    return tx.replacementPart.create({
      data: {
        orderId,
        name,
        quantity: data.quantity,
        productId: data.productId ?? null,
        unitPriceCents: data.unitPriceCents ?? null,
        serialNumber: data.serialNumber ?? null,
        fromInventory: data.fromInventory,
        repairTaskId: data.repairTaskId ?? null,
      },
    });
  });
}

export async function addQualityChecklist(
  user: CurrentUser,
  orderId: string,
  data: { items: { label: string; result: CheckResult; notes?: string }[]; notes?: string },
) {
  const order = await getAccessibleOrder(user, orderId);
  if (!["IN_REPAIR", "IN_TESTING"].includes(order.status))
    throw new BusinessError("El control de calidad se realiza tras la reparación.");
  const passed = data.items.length > 0 && data.items.every((i) => i.result !== "FAIL");
  return db.$transaction(async (tx) => {
    const qc = await tx.qualityChecklist.create({
      data: {
        orderId,
        passed,
        notes: data.notes ?? null,
        performedById: user.id,
        items: { create: data.items.map((i) => ({ label: i.label, result: i.result, notes: i.notes ?? null })) },
      },
    });
    if (order.status === "IN_REPAIR") {
      await tx.serviceOrder.update({ where: { id: orderId }, data: { status: "IN_TESTING" } });
      await tx.serviceOrderHistory.create({
        data: { orderId, fromStatus: "IN_REPAIR", toStatus: "IN_TESTING", note: "Equipo en pruebas de calidad", userId: user.id },
      });
    }
    await tx.serviceOrderHistory.create({
      data: { orderId, note: passed ? "Control de calidad aprobado" : "Control de calidad con observaciones", isPublic: true, userId: user.id },
    });
    return qc;
  });
}

export async function closeServiceOrder(
  user: CurrentUser,
  orderId: string,
  data: {
    finalResult: string;
    warrantyDays?: number;
    warrantyTerms?: string;
    closingRecommendations?: string;
    customerConformity: boolean;
    conformityNotes?: string;
    deliveredAt?: Date;
  },
) {
  const order = await getAccessibleOrder(user, orderId);
  if (order.status !== "READY_FOR_DELIVERY") throw new BusinessError("La orden debe estar lista para entrega.");
  await db.serviceOrder.update({
    where: { id: orderId },
    data: {
      finalResult: data.finalResult,
      warrantyDays: data.warrantyDays ?? null,
      warrantyTerms: data.warrantyTerms ?? null,
      closingRecommendations: data.closingRecommendations ?? null,
      customerConformity: data.customerConformity,
      conformityNotes: data.conformityNotes ?? null,
    },
  });
  await transitionServiceOrder({ user, orderId, to: "DELIVERED", note: "Equipo entregado al cliente", isPublic: true });
  if (data.deliveredAt) await db.serviceOrder.update({ where: { id: orderId }, data: { deliveredAt: data.deliveredAt } });
}

// -----------------------------------------------------------------------------
// Seguimiento público
// -----------------------------------------------------------------------------

export type PublicTracking = {
  code: string;
  status: ServiceOrderStatus;
  receivedAt: Date;
  deviceType: DeviceType;
  brand: string;
  model: string | null;
  serviceName: string | null;
  diagnosisSummary: string | null;
  publicNotes: string | null;
  deliveryMode: ServiceDeliveryMode;
  estimatedReadyAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  customerFirstName: string;
  pendingQuote: { budgetCents: number; description: string } | null;
  history: { status: ServiceOrderStatus | null; note: string | null; createdAt: Date }[];
};

/**
 * Busca una orden por código + dato de verificación (correo o teléfono).
 * Devuelve SOLO datos aptos para el cliente: sin notas internas, sin datos de
 * contacto completos, sin información técnica confidencial.
 */
export async function findPublicTracking(codeInput: string, verifier: string): Promise<PublicTracking | null> {
  const code = normalizeCode(codeInput);
  const order = await db.serviceOrder.findUnique({
    where: { code },
    include: {
      customer: { select: { fullName: true, email: true, phone: true } },
      service: { select: { name: true } },
      diagnoses: { select: { publicSummary: true }, orderBy: { createdAt: "desc" }, take: 1 },
      approvals: { where: { decision: "PENDING" }, select: { budgetCents: true, description: true }, take: 1 },
      history: {
        where: { isPublic: true },
        select: { toStatus: true, note: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) return null;
  const v = verifier.trim().toLowerCase();
  const emailOk = !!order.customer.email && order.customer.email.toLowerCase() === v;
  const phoneOk = phonesMatch(order.customer.phone, v);
  if (!emailOk && !phoneOk) return null;

  return {
    code: order.code,
    status: order.status,
    receivedAt: order.receivedAt,
    deviceType: order.deviceType,
    brand: order.brand,
    model: order.model,
    serviceName: order.service?.name ?? null,
    diagnosisSummary: order.diagnoses[0]?.publicSummary ?? null,
    publicNotes: order.publicNotes,
    deliveryMode: order.deliveryMode,
    estimatedReadyAt: order.estimatedReadyAt,
    completedAt: order.completedAt,
    deliveredAt: order.deliveredAt,
    customerFirstName: order.customer.fullName.split(" ")[0] ?? "",
    pendingQuote: order.approvals[0] ?? null,
    history: order.history.map((h) => ({ status: h.toStatus, note: h.note, createdAt: h.createdAt })),
  };
}
