"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions";
import { BusinessError, handleActionError } from "@/lib/actions";
import { runAdminAction } from "@/lib/admin-action";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audit } from "@/lib/security/audit";
import { hasPermission } from "@/lib/security/permissions";
import { validateUpload } from "@/lib/security/file-validation";
import { buildKey, putObject } from "@/lib/storage";
import {
  approvalDecisionSchema, closeSchema, diagnosisSchema, noteSchema, partSchema, quoteSchema, receptionSchema,
  repairTaskSchema, serviceOrderEditSchema, transitionSchema,
} from "@/lib/validations/admin";
import {
  addDiagnosis, addHistoryNote, addQualityChecklist, addRepairTask, addReplacementPart, closeServiceOrder,
  createServiceOrder, getAccessibleOrder, recordApprovalDecision, sendQuote, transitionServiceOrder,
} from "@/services/service-orders";

type S = ActionResult<unknown> | null;
const refresh = (id?: string) => {
  revalidatePath("/admin/ordenes");
  if (id) revalidatePath(`/admin/ordenes/${id}`);
};

export async function createServiceOrderAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", receptionSchema, fd, async (d, user) => {
    const order = await createServiceOrder(
      {
        customerId: d.customerId,
        customer: d.customerId
          ? undefined
          : { fullName: d.customerName!, phone: d.customerPhone!, email: d.customerEmail, documentType: d.documentType, documentNumber: d.documentNumber },
        serviceId: d.serviceId,
        technicianId: hasPermission(user.role, "service-orders:assign") ? d.technicianId : undefined,
        deviceType: d.deviceType,
        brand: d.brand,
        model: d.model,
        serialNumber: d.serialNumber,
        accessories: d.accessories,
        physicalCondition: d.physicalCondition,
        reportedIssue: d.reportedIssue,
        accessProvided: d.accessProvided,
        dataBackupAuthorized: d.dataBackupAuthorized,
        deliveryMode: d.deliveryMode,
        estimatedReadyAt: d.estimatedReadyAt,
        publicNotes: d.publicNotes,
        internalNotes: d.internalNotes,
        receivedAt: d.receivedAt,
      },
      user,
    );
    refresh();
    return { ok: true, data: { id: order.id, code: order.code }, message: `Orden ${order.code} creada.` };
  });
}

export async function updateServiceOrderAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", serviceOrderEditSchema, fd, async (d, user) => {
    await getAccessibleOrder(user, d.orderId);
    const before = await db.serviceOrder.findUniqueOrThrow({ where: { id: d.orderId } });
    if (["DELIVERED", "CANCELLED"].includes(before.status)) throw new BusinessError("La orden está cerrada.");
    const canAssign = hasPermission(user.role, "service-orders:assign");
    const after = await db.serviceOrder.update({
      where: { id: d.orderId },
      data: {
        serviceId: d.serviceId ?? null,
        ...(canAssign ? { technicianId: d.technicianId ?? null } : {}),
        deviceType: d.deviceType,
        brand: d.brand,
        model: d.model ?? null,
        serialNumber: d.serialNumber ?? null,
        accessories: d.accessories ?? null,
        physicalCondition: d.physicalCondition ?? null,
        reportedIssue: d.reportedIssue,
        deliveryMode: d.deliveryMode,
        estimatedReadyAt: d.estimatedReadyAt ?? null,
        publicNotes: d.publicNotes ?? null,
        internalNotes: d.internalNotes ?? null,
        accessProvided: d.accessProvided,
        dataBackupAuthorized: d.dataBackupAuthorized,
      },
    });
    if (canAssign && before.technicianId !== after.technicianId) {
      await db.serviceOrderHistory.create({ data: { orderId: d.orderId, note: "Técnico asignado actualizado", isPublic: false, userId: user.id } });
    }
    await audit({ userId: user.id, action: "service-order.update", entity: "ServiceOrder", entityId: d.orderId, before, after });
    refresh(d.orderId);
  });
}

export async function transitionAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", transitionSchema, fd, async (d, user) => {
    await transitionServiceOrder({ user, orderId: d.orderId, to: d.to, note: d.note, isPublic: d.isPublic });
    refresh(d.orderId);
    return { ok: true, message: "Estado actualizado." };
  });
}

export async function addNoteAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", noteSchema, fd, async (d, user) => {
    await addHistoryNote(user, d.orderId, d.note, d.isPublic);
    refresh(d.orderId);
    return { ok: true, message: "Observación registrada." };
  });
}

export async function diagnosisAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", diagnosisSchema, fd, async ({ orderId, ...d }, user) => {
    await addDiagnosis(user, orderId, d);
    refresh(orderId);
    return { ok: true, message: "Diagnóstico registrado." };
  });
}

export async function quoteAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", quoteSchema, fd, async ({ orderId, ...d }, user) => {
    const diag = await db.diagnosis.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" }, select: { id: true } });
    await sendQuote(user, orderId, { ...d, diagnosisId: diag?.id });
    refresh(orderId);
    return { ok: true, message: "Presupuesto registrado como enviado." };
  });
}

export async function approvalAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", approvalDecisionSchema, fd, async (d, user) => {
    const a = await db.serviceApproval.findUnique({ where: { id: d.approvalId }, select: { orderId: true } });
    await recordApprovalDecision(user, d.approvalId, d);
    refresh(a?.orderId);
    return { ok: true, message: d.decision === "APPROVED" ? "Aprobación registrada." : "Rechazo registrado." };
  });
}

export async function repairTaskAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", repairTaskSchema, fd, async ({ orderId, ...d }, user) => {
    await addRepairTask(user, orderId, d);
    refresh(orderId);
    return { ok: true, message: "Actividad registrada." };
  });
}

export async function partAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", partSchema, fd, async ({ orderId, ...d }, user) => {
    await addReplacementPart(user, orderId, { ...d, name: d.name ?? "" });
    refresh(orderId);
    revalidatePath("/admin/inventario");
    return { ok: true, message: "Repuesto registrado." };
  });
}

const qcSchema = z.object({ orderId: z.string().min(1).max(40), notes: z.string().max(1000).optional() });

export async function qualityAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("service-orders:write");
    const base = qcSchema.parse({ orderId: fd.get("orderId"), notes: fd.get("notes") || undefined });
    const labels = fd.getAll("label").map(String);
    const items = labels.map((label, i) => {
      const result = String(fd.get(`result_${i}`) ?? "");
      if (!["PASS", "FAIL", "NOT_APPLICABLE"].includes(result)) throw new BusinessError(`Selecciona el resultado de "${label}".`);
      const notes = String(fd.get(`notes_${i}`) ?? "").slice(0, 300) || undefined;
      return { label: label.slice(0, 80), result: result as "PASS" | "FAIL" | "NOT_APPLICABLE", notes };
    });
    if (!items.length) throw new BusinessError("El checklist está vacío.");
    await addQualityChecklist(user, base.orderId, { items, notes: base.notes });
    refresh(base.orderId);
    return { ok: true, message: "Control de calidad registrado." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function closeAction(_: S, fd: FormData) {
  return runAdminAction("service-orders:write", closeSchema, fd, async ({ orderId, ...d }, user) => {
    await closeServiceOrder(user, orderId, d);
    refresh(orderId);
    return { ok: true, message: "Orden cerrada y entregada." };
  });
}

export async function uploadAttachmentsAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("service-orders:write");
    const orderId = String(fd.get("orderId") ?? "");
    const kind = String(fd.get("kind") ?? "OTHER");
    if (!["RECEPTION_PHOTO", "DIAGNOSIS_PHOTO", "REPAIR_PHOTO", "APPROVAL_EVIDENCE", "OTHER"].includes(kind)) throw new BusinessError("Tipo inválido.");
    await getAccessibleOrder(user, orderId);
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new BusinessError("Selecciona al menos un archivo.");
    if (files.length > 8) throw new BusinessError("Máximo 8 archivos por envío.");
    for (const file of files) {
      const check = await validateUpload(file, { allowPdf: kind === "APPROVAL_EVIDENCE" });
      if (!check.ok) throw new BusinessError(`${file.name}: ${check.error}`);
      const key = buildKey("service-orders", check.ext);
      await putObject(key, check.bytes, check.mime);
      await db.attachment.create({
        data: {
          kind: kind as "OTHER",
          storageKey: key,
          fileName: file.name.slice(0, 120),
          mimeType: check.mime,
          sizeBytes: file.size,
          serviceOrderId: orderId,
          uploadedById: user.id,
        },
      });
    }
    await audit({ userId: user.id, action: "service-order.attachments", entity: "ServiceOrder", entityId: orderId, after: { count: files.length, kind } });
    refresh(orderId);
    return { ok: true, message: `${files.length} archivo(s) adjuntado(s).` };
  } catch (e) {
    return handleActionError(e);
  }
}
