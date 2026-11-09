import "server-only";
import { db, type Tx } from "@/lib/db";
import { BusinessError } from "@/lib/actions";
import type { InventoryMovementType } from "@/generated/prisma/enums";

export type MovementInput = {
  productId: string;
  type: InventoryMovementType;
  /** Cantidad positiva. En ADJUSTMENT representa el NUEVO conteo físico total. */
  quantity: number;
  userId?: string | null;
  reason?: string | null;
  reference?: string | null;
  unitCostCents?: number | null;
  supplierId?: string | null;
  orderId?: string | null;
  serviceOrderId?: string | null;
};

type LockedProduct = { id: string; name: string; stock: number; reserved: number };

/** Bloquea la fila del producto (SELECT ... FOR UPDATE) dentro de la transacción. */
export async function lockProduct(tx: Tx, productId: string): Promise<LockedProduct> {
  const rows = await tx.$queryRaw<LockedProduct[]>`
    SELECT "id", "name", "stock", "reserved" FROM "Product" WHERE "id" = ${productId} FOR UPDATE`;
  const p = rows[0];
  if (!p) throw new BusinessError("Producto no encontrado.");
  return p;
}

/**
 * Calcula el efecto de un movimiento sobre (stock, reservado).
 * Función pura: es la regla de negocio que se prueba unitariamente.
 */
export function computeMovement(
  current: { stock: number; reserved: number },
  type: InventoryMovementType,
  quantity: number,
): { stockDelta: number; reservedDelta: number } {
  if (!Number.isInteger(quantity) || quantity < 0) throw new BusinessError("Cantidad inválida.");
  if (type !== "ADJUSTMENT" && quantity === 0) throw new BusinessError("La cantidad debe ser mayor a 0.");
  const available = current.stock - current.reserved;
  let stockDelta = 0;
  let reservedDelta = 0;
  switch (type) {
    case "ENTRY":
    case "RETURN":
      stockDelta = quantity;
      break;
    case "EXIT":
    case "SERVICE_USE":
      if (quantity > available)
        throw new BusinessError(`Stock disponible insuficiente (disponible: ${available}).`);
      stockDelta = -quantity;
      break;
    case "ADJUSTMENT":
      if (quantity < current.reserved)
        throw new BusinessError(
          `El conteo no puede ser menor a las unidades reservadas (${current.reserved}).`,
        );
      stockDelta = quantity - current.stock;
      break;
    case "RESERVATION":
      if (quantity > available)
        throw new BusinessError(`Stock disponible insuficiente (disponible: ${available}).`);
      reservedDelta = quantity;
      break;
    case "RELEASE":
      if (quantity > current.reserved) throw new BusinessError("No hay reservas suficientes para liberar.");
      reservedDelta = -quantity;
      break;
    case "SALE":
      if (quantity > current.reserved || quantity > current.stock)
        throw new BusinessError("La venta debe corresponder a unidades reservadas.");
      stockDelta = -quantity;
      reservedDelta = -quantity;
      break;
  }
  return { stockDelta, reservedDelta };
}

/**
 * Aplica un movimiento de inventario de forma atómica y trazable.
 * Debe llamarse dentro de una transacción.
 */
export async function applyMovement(tx: Tx, input: MovementInput) {
  if (input.type === "ADJUSTMENT" && !input.reason?.trim())
    throw new BusinessError("Los ajustes manuales requieren un motivo.");
  const p = await lockProduct(tx, input.productId);
  const { stockDelta, reservedDelta } = computeMovement(p, input.type, input.quantity);
  const stockAfter = p.stock + stockDelta;
  const reservedAfter = p.reserved + reservedDelta;
  if (stockAfter < 0 || reservedAfter < 0 || reservedAfter > stockAfter)
    throw new BusinessError("El movimiento dejaría el inventario en un estado inválido.");

  await tx.product.update({
    where: { id: p.id },
    data: { stock: stockAfter, reserved: reservedAfter },
  });
  return tx.inventoryMovement.create({
    data: {
      productId: p.id,
      type: input.type,
      stockDelta,
      reservedDelta,
      stockAfter,
      reservedAfter,
      unitCostCents: input.unitCostCents ?? null,
      reason: input.reason ?? null,
      reference: input.reference ?? null,
      userId: input.userId ?? null,
      supplierId: input.supplierId ?? null,
      orderId: input.orderId ?? null,
      serviceOrderId: input.serviceOrderId ?? null,
    },
  });
}

/** Registra un movimiento manual desde el panel (transacción propia). */
export async function registerManualMovement(input: MovementInput) {
  if (!["ENTRY", "EXIT", "ADJUSTMENT", "RETURN"].includes(input.type))
    throw new BusinessError("Tipo de movimiento no permitido manualmente.");
  return db.$transaction((tx) => applyMovement(tx, input));
}

export async function getLowStockProducts(limit = 10) {
  // stock disponible <= mínimo
  return db.$queryRaw<
    { id: string; name: string; sku: string; stock: number; reserved: number; minStock: number }[]
  >`
    SELECT "id", "name", "sku", "stock", "reserved", "minStock" FROM "Product"
    WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE' AND ("stock" - "reserved") <= "minStock"
    ORDER BY ("stock" - "reserved") ASC, "name" ASC LIMIT ${limit}`;
}
