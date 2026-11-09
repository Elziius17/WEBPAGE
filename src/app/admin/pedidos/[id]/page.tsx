import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AdminPageHeader, KeyValue, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { DeliveryPanel } from "@/components/admin/delivery-panel";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { requireStaffPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";
import { db } from "@/lib/db";
import { ORDER_TRANSITIONS } from "@/services/orders";
import { centsToSoles, formatPEN } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/config/statuses";
import { orderStatusAction, registerPaymentAction } from "@/actions/admin/commerce";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderDetail({ params }: PageProps<"/admin/pedidos/[id]">) {
  const user = await requireStaffPage("orders:read");
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { stock: true, reserved: true, id: true } } } },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { verifiedBy: { select: { name: true } } },
      },
      history: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      delivery: {
        include: {
          address: true,
          courier: true,
          zone: true,
          tracking: {
            orderBy: { occurredAt: "desc" },
            include: { createdBy: { select: { name: true } } },
          },
          attachments: true,
        },
      },
    },
  });
  if (!order) notFound();
  const [couriers, zones] = await Promise.all([
    db.courier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.deliveryZone.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const canWrite = hasPermission(user.role, "orders:write");
  const next = ORDER_TRANSITIONS[order.status];
  const verified = order.payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((s, p) => s + p.amountCents, 0);
  const waMsg = `Hola ${order.contactName.split(" ")[0]}, te escribimos de ELZIIUS por tu pedido ${order.code} (${formatPEN(order.totalCents)}). Estado: ${orderStatusLabel[order.status]}.`;
  const wa = whatsappLink(waMsg, order.contactPhone);
  const stockIssues =
    order.status === "PENDING_CONFIRMATION"
      ? order.items.filter((i) => i.product.stock - i.product.reserved < i.quantity)
      : [];

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.code}</span>
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={`Registrado ${formatDateTime(order.createdAt)}`}
        actions={
          wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "whatsapp", size: "sm" })}
            >
              <MessageCircle /> Contactar cliente
            </a>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Productos">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-fg-subtle text-left text-xs">
                  <th className="pb-2">Producto</th>
                  <th>Cant.</th>
                  <th>P. unit.</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-t border-white/5">
                    <td className="py-2.5">
                      <Link
                        href={`/admin/productos/${i.productId}`}
                        className="text-fg hover:text-brand-cyan"
                      >
                        {i.productName}
                      </Link>
                      <p className="text-fg-subtle text-xs">
                        {i.sku} · disp. actual {i.product.stock - i.product.reserved}
                      </p>
                    </td>
                    <td>{i.quantity}</td>
                    <td>{formatPEN(i.unitPriceCents)}</td>
                    <td className="text-right">{formatPEN(i.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr className="border-t border-white/8">
                  <td colSpan={3} className="text-fg-muted pt-3 text-right">
                    Subtotal
                  </td>
                  <td className="pt-3 text-right">{formatPEN(order.subtotalCents)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-fg-muted text-right">
                    Envío
                  </td>
                  <td className="text-right">
                    {order.shippingCents == null ? (
                      <span className="text-warning">Por cotizar</span>
                    ) : (
                      formatPEN(order.shippingCents)
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-semibold">
                    Total
                  </td>
                  <td className="font-display text-right text-lg font-bold">
                    {formatPEN(order.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {stockIssues.length > 0 && (
              <Alert tone="warning" className="mt-4">
                Stock insuficiente actualmente para:{" "}
                {stockIssues.map((i) => i.productName).join(", ")}. No podrás confirmar hasta
                regularizar.
              </Alert>
            )}
          </Panel>

          {order.delivery && (
            <DeliveryPanel
              delivery={order.delivery}
              couriers={couriers}
              zones={zones}
              canWrite={hasPermission(user.role, "deliveries:write")}
            />
          )}

          <Panel
            title="Pagos"
            description="Solo se registran pagos verificados con referencia real. La plataforma no procesa pagos."
          >
            <ul className="mb-4 space-y-2 text-sm">
              {order.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/3 p-3"
                >
                  <div>
                    <p className="text-fg">
                      {paymentMethodLabel[p.method]} · {formatPEN(p.amountCents)}
                    </p>
                    <p className="text-fg-subtle text-xs">
                      {p.reference ? `Ref. ${p.reference} · ` : ""}
                      {p.verifiedAt
                        ? `Verificado ${formatDateTime(p.verifiedAt)} por ${p.verifiedBy?.name}`
                        : "Pendiente de verificación"}
                    </p>
                  </div>
                  <Badge
                    tone={
                      p.status === "VERIFIED"
                        ? "success"
                        : p.status === "PENDING"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {paymentStatusLabel[p.status]}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="text-fg-muted mb-4 text-sm">
              Verificado: <strong className="text-fg">{formatPEN(verified)}</strong> de{" "}
              {formatPEN(order.totalCents)}
            </p>
            {canWrite && order.status !== "CANCELLED" && verified < order.totalCents && (
              <ActionForm
                action={registerPaymentAction}
                resetOnSuccess
                className="rounded-xl border border-white/8 p-4"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField name="method" label="Método">
                    <Select id="p-method" name="method">
                      {Object.entries(paymentMethodLabel)
                        .filter(([k]) => k !== "GATEWAY")
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                    </Select>
                  </FormField>
                  <FormField name="amountCents" label="Monto (S/)" required>
                    <Input
                      id="p-amount"
                      name="amountCents"
                      inputMode="decimal"
                      defaultValue={centsToSoles(order.totalCents - verified)}
                    />
                  </FormField>
                  <FormField name="reference" label="N.º de operación / referencia" required>
                    <Input id="p-ref" name="reference" />
                  </FormField>
                </div>
                <FormField name="notes" label="Notas">
                  <Input id="p-notes" name="notes" />
                </FormField>
                <SubmitButton size="sm">Registrar pago verificado</SubmitButton>
              </ActionForm>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {canWrite && next.length > 0 && (
            <Panel title="Gestionar pedido">
              <ActionForm
                action={orderStatusAction}
                confirm="¿Confirmas el cambio de estado del pedido?"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <FormField name="to" label="Nuevo estado">
                  <Select id="o-to" name="to">
                    {next.map((s) => (
                      <option key={s} value={s}>
                        {orderStatusLabel[s]}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {order.status === "PENDING_CONFIRMATION" && order.deliveryMethod === "COURIER" && (
                  <FormField
                    name="shippingCents"
                    label="Costo de envío cotizado (S/)"
                    hint="Al confirmar se reserva el stock"
                  >
                    <Input
                      id="o-ship"
                      name="shippingCents"
                      inputMode="decimal"
                      defaultValue={centsToSoles(order.shippingCents)}
                    />
                  </FormField>
                )}
                <FormField name="note" label="Comentario / motivo">
                  <Textarea id="o-note" name="note" rows={2} />
                </FormField>
                <SubmitButton className="w-full">Actualizar pedido</SubmitButton>
                <p className="text-fg-subtle text-xs">
                  Confirmar: verifica y reserva stock. Completar: registra la venta. Cancelar:
                  libera reservas.
                </p>
              </ActionForm>
            </Panel>
          )}
          <Panel title="Comprador">
            <KeyValue
              cols={1}
              items={[
                [
                  "Nombre",
                  <Link
                    key="n"
                    href={`/admin/clientes/${order.customerId}`}
                    className="hover:text-brand-cyan"
                  >
                    {order.contactName}
                  </Link>,
                ],
                ["Teléfono", order.contactPhone],
                ["Correo", order.contactEmail],
                [
                  "Documento",
                  order.customer.documentNumber
                    ? `${order.customer.documentType} ${order.customer.documentNumber}`
                    : null,
                ],
                ["Comentarios", order.customerNotes],
              ]}
            />
          </Panel>
          <Panel title="Historial">
            <ol className="space-y-3 border-l border-white/10 pl-4 text-sm">
              {order.history.map((h) => (
                <li key={h.id}>
                  <p className="text-fg">
                    {h.fromStatus ? `${orderStatusLabel[h.fromStatus]} → ` : ""}
                    {orderStatusLabel[h.toStatus]}
                  </p>
                  {h.note && <p className="text-fg-muted">{h.note}</p>}
                  <p className="text-fg-subtle text-xs">
                    {formatDateTime(h.createdAt)} · {h.user?.name ?? "Cliente / sistema"}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
