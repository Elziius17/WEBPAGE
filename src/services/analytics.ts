import "server-only";
import { db } from "@/lib/db";
import { startOfDayLima, startOfMonthLima } from "@/lib/utils/dates";

const ACTIVE_ORDER = ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY"] as const;

export async function getDashboardKpis() {
  const today = startOfDayLima();
  const month = startOfMonthLima();
  const [salesToday, salesMonth, pendingOrders, deliveredMonth, newRequests, inRepair, pendingApproval, activeProducts, lowStock, serviceIncome] =
    await Promise.all([
      db.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { status: "COMPLETED", completedAt: { gte: today } } }),
      db.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { status: "COMPLETED", completedAt: { gte: month } } }),
      db.order.count({ where: { status: { in: [...ACTIVE_ORDER] } } }),
      db.order.count({ where: { status: "COMPLETED", completedAt: { gte: month } } }),
      db.serviceRequest.count({ where: { status: "NEW" } }),
      db.serviceOrder.count({ where: { status: { in: ["IN_DIAGNOSIS", "APPROVED", "IN_REPAIR", "IN_TESTING"] } } }),
      db.serviceOrder.count({ where: { status: { in: ["QUOTE_SENT", "PENDING_APPROVAL"] } } }),
      db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Product" WHERE "deletedAt" IS NULL AND "status"='ACTIVE' AND "stock" - "reserved" > 0`,
      db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Product" WHERE "deletedAt" IS NULL AND "status"='ACTIVE' AND "stock" - "reserved" <= "minStock"`,
      db.$queryRaw<{ total: bigint | null }[]>`
        SELECT SUM(a."budgetCents")::bigint AS total FROM "ServiceApproval" a
        JOIN "ServiceOrder" o ON o."id" = a."orderId"
        WHERE a."decision"='APPROVED' AND o."status"='DELIVERED' AND o."deliveredAt" >= ${month}`,
    ]);
  return {
    salesTodayCents: salesToday._sum.totalCents ?? 0,
    salesTodayCount: salesToday._count,
    salesMonthCents: salesMonth._sum.totalCents ?? 0,
    salesMonthCount: salesMonth._count,
    pendingOrders,
    deliveredMonth,
    newRequests,
    inRepair,
    pendingApproval,
    activeProducts: Number(activeProducts[0]?.n ?? 0),
    lowStock: Number(lowStock[0]?.n ?? 0),
    serviceIncomeMonthCents: Number(serviceIncome[0]?.total ?? 0),
    productIncomeMonthCents: salesMonth._sum.totalCents ?? 0,
  };
}

/** Ventas de productos y servicios por mes (últimos N meses, hora de Lima). */
export async function getMonthlySales(months = 6) {
  const rows = await db.$queryRaw<{ month: string; products: bigint; services: bigint }[]>`
    WITH m AS (
      SELECT to_char(date_trunc('month', (now() AT TIME ZONE 'America/Lima')) - (n || ' month')::interval, 'YYYY-MM') AS month
      FROM generate_series(0, ${months - 1}) n
    ),
    p AS (
      SELECT to_char(("completedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima'), 'YYYY-MM') AS month, SUM("totalCents") AS total
      FROM "Order" WHERE "status"='COMPLETED' AND "completedAt" IS NOT NULL GROUP BY 1
    ),
    s AS (
      SELECT to_char((o."deliveredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima'), 'YYYY-MM') AS month, SUM(a."budgetCents") AS total
      FROM "ServiceApproval" a JOIN "ServiceOrder" o ON o."id" = a."orderId"
      WHERE a."decision"='APPROVED' AND o."status"='DELIVERED' AND o."deliveredAt" IS NOT NULL GROUP BY 1
    )
    SELECT m.month, COALESCE(p.total,0)::bigint AS products, COALESCE(s.total,0)::bigint AS services
    FROM m LEFT JOIN p ON p.month = m.month LEFT JOIN s ON s.month = m.month ORDER BY m.month`;
  return rows.map((r) => ({ month: r.month, products: Number(r.products) / 100, services: Number(r.services) / 100 }));
}

export async function getTopProducts(limit = 5) {
  const rows = await db.$queryRaw<{ name: string; qty: bigint }[]>`
    SELECT i."productName" AS name, SUM(i."quantity")::bigint AS qty FROM "OrderItem" i
    JOIN "Order" o ON o."id" = i."orderId" WHERE o."status" = 'COMPLETED'
    GROUP BY i."productName" ORDER BY qty DESC LIMIT ${limit}`;
  return rows.map((r) => ({ name: r.name, qty: Number(r.qty) }));
}

export async function getTopServices(limit = 7) {
  const rows = await db.$queryRaw<{ name: string; orders: bigint; requests: bigint }[]>`
    SELECT s."name",
      (SELECT COUNT(*) FROM "ServiceOrder" o WHERE o."serviceId" = s."id")::bigint AS orders,
      (SELECT COUNT(*) FROM "ServiceRequest" r WHERE r."serviceId" = s."id")::bigint AS requests
    FROM "Service" s WHERE s."deletedAt" IS NULL ORDER BY orders DESC, requests DESC LIMIT ${limit}`;
  return rows.map((r) => ({ name: r.name, total: Number(r.orders) + Number(r.requests), orders: Number(r.orders), requests: Number(r.requests) }));
}

export async function getServiceStatusDistribution() {
  const rows = await db.serviceOrder.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

export async function getDeliveryDistribution() {
  const rows = await db.delivery.groupBy({ by: ["method", "status"], _count: { _all: true } });
  return rows.map((r) => ({ method: r.method, status: r.status, count: r._count._all }));
}

/** Evolución del total de unidades en inventario al cierre de cada mes. */
export async function getInventoryEvolution(months = 6) {
  const rows = await db.$queryRaw<{ month: string; units: bigint }[]>`
    WITH m AS (
      SELECT date_trunc('month', (now() AT TIME ZONE 'America/Lima')) - (n || ' month')::interval AS start
      FROM generate_series(0, ${months - 1}) n
    )
    SELECT to_char(m.start, 'YYYY-MM') AS month,
      COALESCE((SELECT SUM(mv."stockDelta") FROM "InventoryMovement" mv
        WHERE (mv."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') < m.start + interval '1 month'), 0)::bigint AS units
    FROM m ORDER BY m.start`;
  return rows.map((r) => ({ month: r.month, units: Number(r.units) }));
}

export async function getRecentActivity() {
  const [orders, services] = await Promise.all([
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, code: true, status: true, totalCents: true, contactName: true, createdAt: true } }),
    db.serviceOrder.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, code: true, status: true, brand: true, deviceType: true, updatedAt: true, customer: { select: { fullName: true } } } }),
  ]);
  return { orders, services };
}
