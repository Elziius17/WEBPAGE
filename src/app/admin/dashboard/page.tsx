import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  Inbox,
  Package,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Wrench,
  Hourglass,
} from "lucide-react";
import { AdminPageHeader, Panel, StatCard } from "@/components/admin/ui";
import { HorizontalBars, InventoryLine, MonthlySalesChart } from "@/components/admin/charts";
import { OrderStatusBadge, ServiceStatusBadge } from "@/components/ui/status-badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { formatPEN } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/dates";
import { deliveryStatusLabel, serviceOrderStatusLabel } from "@/config/statuses";
import {
  getDashboardKpis,
  getDeliveryDistribution,
  getInventoryEvolution,
  getMonthlySales,
  getRecentActivity,
  getServiceStatusDistribution,
  getTopProducts,
  getTopServices,
} from "@/services/analytics";
import { getLowStockProducts } from "@/services/inventory";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireStaffPage("dashboard:view");
  const canMoney = hasPermission(user.role, "orders:read");
  const [
    k,
    monthly,
    topProducts,
    topServices,
    statusDist,
    deliveryDist,
    inventory,
    recent,
    lowStock,
  ] = await Promise.all([
    getDashboardKpis(),
    getMonthlySales(6),
    getTopProducts(5),
    getTopServices(7),
    getServiceStatusDistribution(),
    getDeliveryDistribution(),
    getInventoryEvolution(6),
    getRecentActivity(),
    getLowStockProducts(6),
  ]);
  const deliveries = Object.entries(
    deliveryDist.reduce<Record<string, number>>((acc, d) => {
      const key = `${d.method === "PICKUP" ? "Recojo" : "Courier"} · ${deliveryStatusLabel[d.status]}`;
      acc[key] = (acc[key] ?? 0) + d.count;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Hola, ${user.name.split(" ")[0]}. Resumen de la operación de ELZIIUS (hora de Lima).`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canMoney && (
          <StatCard
            label="Ventas del día"
            value={formatPEN(k.salesTodayCents)}
            hint={`${k.salesTodayCount} pedido(s) completados`}
            icon={Wallet}
          />
        )}
        {canMoney && (
          <StatCard
            label="Ventas del mes"
            value={formatPEN(k.salesMonthCents)}
            hint={`${k.salesMonthCount} pedido(s) completados`}
            icon={TrendingUp}
          />
        )}
        <StatCard
          label="Pedidos pendientes"
          value={k.pendingOrders}
          icon={ShoppingBag}
          tone="warning"
          href="/admin/pedidos?estado=activos"
        />
        <StatCard
          label="Pedidos entregados (mes)"
          value={k.deliveredMonth}
          icon={PackageCheck}
          tone="success"
        />
        <StatCard
          label="Solicitudes nuevas"
          value={k.newRequests}
          icon={Inbox}
          tone="info"
          href="/admin/solicitudes"
        />
        <StatCard
          label="Equipos en proceso"
          value={k.inRepair}
          hint="Diagnóstico, reparación y pruebas"
          icon={Wrench}
          href="/admin/ordenes?estado=proceso"
        />
        <StatCard
          label="Pendientes de aprobación"
          value={k.pendingApproval}
          icon={Hourglass}
          tone="warning"
          href="/admin/ordenes?estado=aprobacion"
        />
        <StatCard
          label="Productos disponibles"
          value={k.activeProducts}
          hint={`${k.lowStock} con stock bajo`}
          icon={Package}
          tone={k.lowStock ? "danger" : "success"}
          href="/admin/inventario"
        />
        {canMoney && (
          <StatCard
            label="Ingresos por servicios (mes)"
            value={formatPEN(k.serviceIncomeMonthCents)}
            hint="Presupuestos aprobados de equipos entregados"
            icon={ClipboardCheck}
          />
        )}
        {canMoney && (
          <StatCard
            label="Ingresos por productos (mes)"
            value={formatPEN(k.productIncomeMonthCents)}
            icon={ShoppingBag}
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {canMoney && (
          <Panel
            title="Ventas mensuales"
            description="Productos (pedidos completados) y servicios (presupuestos aprobados entregados)"
            className="xl:col-span-2"
          >
            <MonthlySalesChart data={monthly} />
          </Panel>
        )}
        <Panel title="Estado de órdenes técnicas">
          <HorizontalBars
            label="Órdenes"
            data={statusDist
              .map((s) => ({ name: serviceOrderStatusLabel[s.status], value: s.count }))
              .sort((a, b) => b.value - a.value)}
          />
        </Panel>
        <Panel title="Productos más vendidos" description="Unidades en pedidos completados">
          <HorizontalBars
            label="Unidades"
            data={topProducts.map((p) => ({ name: p.name, value: p.qty }))}
            unit=" u."
          />
        </Panel>
        <Panel title="Servicios más solicitados" description="Órdenes + solicitudes web">
          <HorizontalBars
            label="Total"
            data={topServices
              .filter((s) => s.total > 0)
              .map((s) => ({ name: s.name, value: s.total }))}
          />
        </Panel>
        <Panel title="Distribución de entregas">
          <HorizontalBars label="Entregas" data={deliveries} />
        </Panel>
        <Panel
          title="Evolución del inventario"
          description="Unidades en stock al cierre de cada mes"
          className="xl:col-span-2"
        >
          <InventoryLine data={inventory} />
        </Panel>
        <Panel
          title="Stock bajo"
          actions={
            <Link href="/admin/inventario" className="text-brand-cyan text-xs hover:underline">
              Ver inventario
            </Link>
          }
        >
          {lowStock.length ? (
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-fg hover:text-brand-cyan truncate"
                  >
                    {p.name}
                  </Link>
                  <span className="text-warning flex shrink-0 items-center gap-1 text-xs">
                    <AlertTriangle className="size-3.5" aria-hidden /> {p.stock - p.reserved} / mín.{" "}
                    {p.minStock}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-subtle text-sm">Sin alertas de stock.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {canMoney && (
          <Panel title="Últimos pedidos">
            <ul className="divide-y divide-white/6 text-sm">
              {recent.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-fg hover:text-brand-cyan font-mono font-semibold"
                    >
                      {o.code}
                    </Link>
                    <p className="text-fg-subtle truncate text-xs">
                      {o.contactName} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span>{formatPEN(o.totalCents)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
              {!recent.orders.length && <li className="text-fg-subtle py-4">Sin pedidos aún.</li>}
            </ul>
          </Panel>
        )}
        <Panel title="Actividad técnica reciente">
          <ul className="divide-y divide-white/6 text-sm">
            {recent.services.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/admin/ordenes/${s.id}`}
                    className="text-fg hover:text-brand-cyan font-mono font-semibold"
                  >
                    {s.code}
                  </Link>
                  <p className="text-fg-subtle truncate text-xs">
                    {s.customer.fullName} · {s.brand} · {formatDateTime(s.updatedAt)}
                  </p>
                </div>
                <ServiceStatusBadge status={s.status} />
              </li>
            ))}
            {!recent.services.length && <li className="text-fg-subtle py-4">Sin órdenes aún.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
