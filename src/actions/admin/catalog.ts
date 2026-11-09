"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BusinessError, handleActionError, type ActionResult } from "@/lib/actions";
import { runAdminAction } from "@/lib/admin-action";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audit } from "@/lib/security/audit";
import { validateUpload } from "@/lib/security/file-validation";
import { buildKey, deleteObject, publicUrl, putObject } from "@/lib/storage";
import { slugify } from "@/lib/utils/slug";
import {
  categorySchema,
  movementSchema,
  productSchema,
  serviceSchema,
  supplierSchema,
} from "@/lib/validations/admin";
import { registerManualMovement } from "@/services/inventory";
import { Prisma } from "@/generated/prisma/client";

type S = ActionResult<unknown> | null;

/** Convierte "Etiqueta: valor" por línea en [{label, value}]. */
function parseSpecs(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0
        ? {
            label: l.slice(0, i).trim().slice(0, 60),
            value: l
              .slice(i + 1)
              .trim()
              .slice(0, 200),
          }
        : { label: l.slice(0, 60), value: "" };
    });
}

const lines = (t: string) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);

function uniqueViolation(e: unknown, msg: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    throw new BusinessError(msg);
  throw e;
}

export async function saveProductAction(_: S, fd: FormData) {
  return runAdminAction("products:write", productSchema, fd, async (d, user) => {
    const data = {
      name: d.name,
      sku: d.sku,
      slug: slugify(d.slug || d.name),
      brand: d.brand,
      model: d.model ?? null,
      categoryId: d.categoryId,
      supplierId: d.supplierId ?? null,
      shortDescription: d.shortDescription ?? null,
      description: d.description,
      specs: parseSpecs(d.specs),
      priceCents: d.priceCents,
      compareAtPriceCents:
        d.compareAtPriceCents && d.compareAtPriceCents > d.priceCents
          ? d.compareAtPriceCents
          : null,
      costCents: d.costCents ?? null,
      minStock: d.minStock,
      status: d.status,
      condition: d.condition,
      featured: d.featured,
      warrantyMonths: d.warrantyMonths,
      warrantyNotes: d.warrantyNotes ?? null,
      weightGrams: d.weightGrams ?? null,
    };
    try {
      if (d.id) {
        const before = await db.product.findFirst({ where: { id: d.id, deletedAt: null } });
        if (!before) throw new BusinessError("Producto no encontrado.");
        const after = await db.product.update({ where: { id: d.id }, data });
        await audit({
          userId: user.id,
          action: "product.update",
          entity: "Product",
          entityId: d.id,
          before,
          after,
        });
        revalidatePath(`/admin/productos/${d.id}`);
        revalidatePath(`/tienda/${after.slug}`);
        return { ok: true, data: { id: d.id }, message: "Producto actualizado." };
      }
      // El stock inicial NO se define aquí: se registra como movimiento de entrada (trazabilidad).
      const p = await db.product.create({ data: { ...data, stock: 0, reserved: 0 } });
      await audit({
        userId: user.id,
        action: "product.create",
        entity: "Product",
        entityId: p.id,
        after: p,
      });
      revalidatePath("/admin/productos");
      return { ok: true, data: { id: p.id }, message: "Producto creado." };
    } catch (e) {
      uniqueViolation(e, "Ya existe un producto con ese SKU o URL (slug).");
    }
  });
}

/** Elimina definitivamente si nunca tuvo ventas ni movimientos; si no, lo desactiva (borrado lógico). */
export async function deleteProductAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("products:delete");
    const id = z.string().min(1).max(40).parse(fd.get("id"));
    const p = await db.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true, movements: true, replacementUses: true } } },
    });
    if (!p) throw new BusinessError("Producto no encontrado.");
    if (p.reserved > 0)
      throw new BusinessError("El producto tiene unidades reservadas por pedidos en curso.");
    const used = p._count.orderItems + p._count.movements + p._count.replacementUses > 0;
    if (used) {
      await db.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: "INACTIVE", featured: false },
      });
      await audit({
        userId: user.id,
        action: "product.archive",
        entity: "Product",
        entityId: id,
        before: { status: p.status },
      });
    } else {
      const imgs = await db.productImage.findMany({ where: { productId: id } });
      await db.product.delete({ where: { id } });
      await Promise.all(imgs.map((i) => (i.storageKey ? deleteObject(i.storageKey) : null)));
      await audit({
        userId: user.id,
        action: "product.delete",
        entity: "Product",
        entityId: id,
        before: p,
      });
    }
    revalidatePath("/admin/productos");
    return {
      ok: true,
      message: used
        ? "El producto tiene historial: se archivó (eliminación lógica)."
        : "Producto eliminado.",
    };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function uploadProductImagesAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("products:write");
    const productId = z.string().min(1).max(40).parse(fd.get("productId"));
    const product = await db.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { name: true, _count: { select: { images: true } } },
    });
    if (!product) throw new BusinessError("Producto no encontrado.");
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new BusinessError("Selecciona al menos una imagen.");
    if (product._count.images + files.length > 10)
      throw new BusinessError("Máximo 10 imágenes por producto.");
    let order = product._count.images;
    for (const file of files) {
      const check = await validateUpload(file);
      if (!check.ok) throw new BusinessError(`${file.name}: ${check.error}`);
      const key = buildKey("products", check.ext);
      await putObject(key, check.bytes, check.mime);
      await db.productImage.create({
        data: {
          productId,
          storageKey: key,
          url: publicUrl(key),
          alt: product.name,
          sortOrder: order++,
        },
      });
    }
    await audit({
      userId: user.id,
      action: "product.images",
      entity: "Product",
      entityId: productId,
      after: { added: files.length },
    });
    revalidatePath(`/admin/productos/${productId}`);
    return { ok: true, message: "Imágenes cargadas." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteProductImageAction(_: S, fd: FormData): Promise<ActionResult> {
  try {
    const user = await authorize("products:write");
    const id = z.string().min(1).max(40).parse(fd.get("imageId"));
    const img = await db.productImage.findUnique({ where: { id } });
    if (!img) throw new BusinessError("Imagen no encontrada.");
    await db.productImage.delete({ where: { id } });
    if (img.storageKey) await deleteObject(img.storageKey);
    await audit({
      userId: user.id,
      action: "product.image.delete",
      entity: "Product",
      entityId: img.productId,
    });
    revalidatePath(`/admin/productos/${img.productId}`);
    return { ok: true, message: "Imagen eliminada." };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function registerMovementAction(_: S, fd: FormData) {
  return runAdminAction("inventory:write", movementSchema, fd, async (d, user) => {
    const mv = await registerManualMovement({ ...d, userId: user.id });
    if (d.type === "ENTRY" && d.unitCostCents)
      await db.product.update({ where: { id: d.productId }, data: { costCents: d.unitCostCents } });
    await audit({
      userId: user.id,
      action: "inventory.movement",
      entity: "Product",
      entityId: d.productId,
      after: { type: d.type, quantity: d.quantity, stockAfter: mv.stockAfter },
    });
    revalidatePath("/admin/inventario");
    revalidatePath(`/admin/productos/${d.productId}`);
    return { ok: true, message: `Movimiento registrado. Stock actual: ${mv.stockAfter}.` };
  });
}

export async function saveSupplierAction(_: S, fd: FormData) {
  return runAdminAction("suppliers:write", supplierSchema, fd, async ({ id, ...d }, user) => {
    const data = {
      ...d,
      ruc: d.ruc ?? null,
      contactName: d.contactName ?? null,
      phone: d.phone ?? null,
      email: d.email ?? null,
      address: d.address ?? null,
      notes: d.notes ?? null,
    };
    try {
      const s = id
        ? await db.supplier.update({ where: { id }, data })
        : await db.supplier.create({ data });
      await audit({
        userId: user.id,
        action: id ? "supplier.update" : "supplier.create",
        entity: "Supplier",
        entityId: s.id,
        after: s,
      });
    } catch (e) {
      uniqueViolation(e, "Ya existe un proveedor con ese RUC.");
    }
    revalidatePath("/admin/inventario/proveedores");
  });
}

export async function saveCategoryAction(_: S, fd: FormData) {
  return runAdminAction("products:write", categorySchema, fd, async ({ id, ...d }, user) => {
    const data = {
      name: d.name,
      slug: slugify(d.slug || d.name),
      description: d.description ?? null,
      icon: d.icon ?? null,
      sortOrder: d.sortOrder,
      active: d.active,
    };
    try {
      const c = id
        ? await db.category.update({ where: { id }, data })
        : await db.category.create({ data });
      await audit({
        userId: user.id,
        action: id ? "category.update" : "category.create",
        entity: "Category",
        entityId: c.id,
        after: c,
      });
    } catch (e) {
      uniqueViolation(e, "Ya existe una categoría con esa URL.");
    }
    revalidatePath("/admin/productos/categorias");
  });
}

export async function saveServiceAction(_: S, fd: FormData) {
  return runAdminAction("services:write", serviceSchema, fd, async ({ id, ...d }, user) => {
    const data = {
      code: d.code,
      name: d.name,
      slug: slugify(d.slug || d.name),
      icon: d.icon || "wrench",
      shortDescription: d.shortDescription,
      description: d.description,
      benefits: lines(d.benefits),
      activities: lines(d.activities),
      procedure: lines(d.procedure),
      estimatedTime: d.estimatedTime ?? null,
      referencePriceCents: d.referencePriceCents ?? null,
      priceNote: d.priceNote ?? null,
      whatsappMessage: d.whatsappMessage ?? null,
      sortOrder: d.sortOrder,
      active: d.active,
    };
    try {
      const before = id ? await db.service.findUnique({ where: { id } }) : null;
      const s = id
        ? await db.service.update({ where: { id }, data })
        : await db.service.create({ data });
      await audit({
        userId: user.id,
        action: id ? "service.update" : "service.create",
        entity: "Service",
        entityId: s.id,
        before,
        after: s,
      });
      revalidatePath("/admin/servicios");
      revalidatePath("/servicios");
      revalidatePath(`/servicios/${s.slug}`);
      return { ok: true, data: { id: s.id }, message: "Servicio guardado." };
    } catch (e) {
      uniqueViolation(e, "Ya existe un servicio con ese código o URL.");
    }
  });
}
