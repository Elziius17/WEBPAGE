import { Badge } from "./badge";
import {
  deliveryStatusLabel,
  deliveryStatusTone,
  orderStatusLabel,
  orderStatusTone,
  serviceOrderStatusLabel,
  serviceOrderStatusTone,
} from "@/config/statuses";
import type { DeliveryStatus, OrderStatus, ServiceOrderStatus } from "@/generated/prisma/enums";

export function ServiceStatusBadge({ status }: { status: ServiceOrderStatus }) {
  return <Badge tone={serviceOrderStatusTone[status]}>{serviceOrderStatusLabel[status]}</Badge>;
}
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderStatusTone[status]}>{orderStatusLabel[status]}</Badge>;
}
export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge tone={deliveryStatusTone[status]}>{deliveryStatusLabel[status]}</Badge>;
}
