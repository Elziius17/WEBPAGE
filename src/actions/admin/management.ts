"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { BusinessError, handleActionError, type ActionResult } from "@/lib/actions";
import { runAdminAction } from "@/lib/admin-action";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audit } from "@/lib/security/audit";
import { customerSchema, requestUpdateSchema, staffUserSchema, testimonialSchema, userRoleSchema } from "@/lib/validations/admin";
import { businessSettingsSchema } from "@/services/settings";
import type { Prisma } from "@/generated/prisma/client";

type S = ActionResult<unknown> | null;

export async function saveCustomerAction(_: S, fd: FormData) {
  return runAdminAction("customers:write", customerSchema, fd, async ({ id, ...d }, user) => {
    const data = {
      fullName: d.fullName, type: d.type, companyName: d.companyName ?? null, documentType: d.documentType ?? null,
      documentNumber: d.documentNumber ?? null, email: d.email ?? null, phone: d.phone, internalNotes: d.internalNotes ?? null,
    };
    const before = id ? await db.customer.findUnique({ where: { id } }) : null;
    const c = id ? await db.customer.update({ where: { id }, data }) : await db.customer.create({ data });
    await audit({ userId: user.id, action: id ? "customer.update" : "customer.create", entity: "Customer", entityId: c.id, before, after: c });
    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${c.id}`);
    return { ok: true, data: { id: c.id }, message: "Cliente guardado." };
  });
}

export async function updateRequestAction(_: S, fd: FormData) {
  return runAdminAction("requests:write", requestUpdateSchema, fd, async (d, user) => {
    await db.serviceRequest.update({ where: { id: d.requestId }, data: { status: d.status, handledNotes: d.handledNotes ?? null } });
    await audit({ userId: user.id, action: "request.update", entity: "ServiceRequest", entityId: d.requestId, after: { status: d.status } });
    revalidatePath("/admin/solicitudes");
  });
}

/** Convierte una solicitud en ficha de cliente (si no existe) para registrar una orden o pedido. */
export async function requestToCustomerAction(_: S, fd: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await authorize("customers:write");
    const id = z.string().min(1).max(40).parse(fd.get("requestId"));
    const r = await db.serviceRequest.findUnique({ where: { id } });
    if (!r) throw new BusinessError("Solicitud no encontrada.");
    const customer = r.customerId
      ? await db.customer.findUniqueOrThrow({ where: { id: r.customerId } })
      : await db.customer.create({ data: { fullName: r.name, phone: r.phone, email: r.email, companyName: r.company, type: r.company ? "COMPANY" : "PERSON" } });
    await db.serviceRequest.update({ where: { id }, data: { customerId: customer.id, status: r.status === "NEW" ? "CONTACTED" : r.status } });
    await audit({ userId: user.id, action: "request.to-customer", entity: "ServiceRequest", entityId: id, after: { customerId: customer.id } });
    revalidatePath("/admin/solicitudes");
    return { ok: true, data: { id: customer.id }, message: "Cliente vinculado." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function createStaffUserAction(_: S, fd: FormData) {
  return runAdminAction("users:manage", staffUserSchema, fd, async (d, user) => {
    if (await db.user.findUnique({ where: { email: d.email } })) throw new BusinessError("Ya existe un usuario con ese correo.");
    const id = randomUUID();
    await db.$transaction(async (tx) => {
      await tx.user.create({ data: { id, email: d.email, name: d.name, role: d.role, emailVerified: true } });
      await tx.account.create({ data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(d.password) } });
      if (d.role === "TECHNICIAN") await tx.technician.create({ data: { userId: id } });
    });
    await audit({ userId: user.id, action: "user.create", entity: "User", entityId: id, after: { email: d.email, role: d.role } });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: "Usuario creado. Comparte la contraseña inicial por un canal seguro." };
  });
}

export async function updateUserRoleAction(_: S, fd: FormData) {
  return runAdminAction("users:manage", userRoleSchema, fd, async (d, user) => {
    if (d.userId === user.id && (d.role !== "ADMIN" || !d.active)) throw new BusinessError("No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.");
    const before = await db.user.findUnique({ where: { id: d.userId } });
    if (!before) throw new BusinessError("Usuario no encontrado.");
    if (before.role === "ADMIN" && (d.role !== "ADMIN" || !d.active)) {
      const admins = await db.user.count({ where: { role: "ADMIN", active: true } });
      if (admins <= 1) throw new BusinessError("Debe existir al menos un administrador activo.");
    }
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: d.userId }, data: { role: d.role, active: d.active } });
      if (d.role === "TECHNICIAN") await tx.technician.upsert({ where: { userId: d.userId }, update: { active: d.active }, create: { userId: d.userId } });
      else await tx.technician.updateMany({ where: { userId: d.userId }, data: { active: false } });
      // Desactivar o cambiar de rol invalida las sesiones activas.
      if (!d.active || d.role !== before.role) await tx.session.deleteMany({ where: { userId: d.userId } });
    });
    await audit({ userId: user.id, action: "user.role", entity: "User", entityId: d.userId, before: { role: before.role, active: before.active }, after: { role: d.role, active: d.active } });
    revalidatePath("/admin/usuarios");
  });
}

export async function saveBusinessSettingsAction(_: S, fd: FormData) {
  return runAdminAction("settings:write", businessSettingsSchema, fd, async (d, user) => {
    const before = await db.businessConfiguration.findUnique({ where: { key: "business" } });
    await db.businessConfiguration.upsert({
      where: { key: "business" },
      update: { value: d as Prisma.InputJsonValue, updatedById: user.id },
      create: { key: "business", value: d as Prisma.InputJsonValue, updatedById: user.id },
    });
    await audit({ userId: user.id, action: "settings.business", entity: "BusinessConfiguration", entityId: "business", before: before?.value, after: d });
    revalidatePath("/", "layout");
    return { ok: true, message: "Configuración guardada." };
  });
}

const qcTemplateSchema = z.object({ items: z.string().max(2000) });

export async function saveQcTemplateAction(_: S, fd: FormData) {
  return runAdminAction("settings:write", qcTemplateSchema, fd, async (d, user) => {
    const items = d.items.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 25);
    if (!items.length) throw new BusinessError("El checklist debe tener al menos un punto.");
    await db.businessConfiguration.upsert({ where: { key: "qc.template" }, update: { value: items, updatedById: user.id }, create: { key: "qc.template", value: items, updatedById: user.id } });
    await audit({ userId: user.id, action: "settings.qc", entity: "BusinessConfiguration", entityId: "qc.template", after: items });
    revalidatePath("/admin/configuracion");
    return { ok: true, message: "Checklist actualizado." };
  });
}

export async function saveTestimonialAction(_: S, fd: FormData) {
  return runAdminAction("settings:write", testimonialSchema, fd, async ({ id, ...d }, user) => {
    const data = { ...d, authorRole: d.authorRole ?? null };
    const t = id ? await db.testimonial.update({ where: { id }, data }) : await db.testimonial.create({ data });
    await audit({ userId: user.id, action: id ? "testimonial.update" : "testimonial.create", entity: "Testimonial", entityId: t.id, after: t });
    revalidatePath("/admin/configuracion");
    revalidatePath("/");
  });
}

export async function deleteTestimonialAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("settings:write");
    const id = z.string().min(1).max(40).parse(fd.get("id"));
    await db.testimonial.delete({ where: { id } });
    await audit({ userId: user.id, action: "testimonial.delete", entity: "Testimonial", entityId: id });
    revalidatePath("/admin/configuracion");
    revalidatePath("/");
    return { ok: true, message: "Testimonio eliminado." };
  } catch (e) {
    return handleActionError(e);
  }
}
