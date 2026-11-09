import type {
  DeliveryStatus,
  OrderStatus,
  ServiceOrderStatus,
  ProductStatus,
  RequestStatus,
  RequestKind,
  DeviceType,
  ServiceDeliveryMode,
  PaymentMethod,
  PaymentStatus,
  InventoryMovementType,
  ApprovalDecision,
  RoleKey,
  ProductCondition,
} from "@/generated/prisma/enums";

export type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "accent";

export const serviceOrderStatusLabel: Record<ServiceOrderStatus, string> = {
  REQUESTED: "Solicitado",
  RECEIVED: "Recibido",
  IN_DIAGNOSIS: "En diagnóstico",
  QUOTE_SENT: "Presupuesto enviado",
  PENDING_APPROVAL: "Pendiente de aprobación",
  APPROVED: "Aprobado",
  IN_REPAIR: "En reparación",
  IN_TESTING: "En pruebas",
  READY_FOR_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const serviceOrderStatusTone: Record<ServiceOrderStatus, Tone> = {
  REQUESTED: "neutral",
  RECEIVED: "info",
  IN_DIAGNOSIS: "info",
  QUOTE_SENT: "warning",
  PENDING_APPROVAL: "warning",
  APPROVED: "accent",
  IN_REPAIR: "accent",
  IN_TESTING: "accent",
  READY_FOR_DELIVERY: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** Orden lineal para la barra de progreso pública. */
export const serviceOrderProgress: ServiceOrderStatus[] = [
  "RECEIVED",
  "IN_DIAGNOSIS",
  "QUOTE_SENT",
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_REPAIR",
  "IN_TESTING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
];

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export const orderStatusTone: Record<OrderStatus, Tone> = {
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "info",
  PREPARING: "accent",
  READY: "accent",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const deliveryStatusLabel: Record<DeliveryStatus, string> = {
  PENDING_COORDINATION: "Pendiente de coordinación",
  PENDING_PAYMENT: "Pendiente de pago",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY_FOR_PICKUP: "Listo para recojo",
  DISPATCHED: "Despachado",
  IN_TRANSIT: "En tránsito",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
  INCIDENT: "Incidencia",
  CANCELLED: "Cancelado",
};

export const deliveryStatusTone: Record<DeliveryStatus, Tone> = {
  PENDING_COORDINATION: "warning",
  PENDING_PAYMENT: "warning",
  CONFIRMED: "info",
  PREPARING: "accent",
  READY_FOR_PICKUP: "success",
  DISPATCHED: "accent",
  IN_TRANSIT: "accent",
  OUT_FOR_DELIVERY: "accent",
  DELIVERED: "success",
  INCIDENT: "danger",
  CANCELLED: "danger",
};

export const productStatusLabel: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  DISCONTINUED: "Descontinuado",
};

export const productConditionLabel: Record<ProductCondition, string> = {
  NEW: "Nuevo",
  REFURBISHED: "Reacondicionado",
  USED: "Usado",
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactado",
  CONVERTED: "Convertida",
  CLOSED: "Cerrada",
};

export const requestKindLabel: Record<RequestKind, string> = {
  SERVICE: "Solicitud de servicio",
  QUOTE: "Cotización",
  CONTACT: "Contacto",
  PRODUCT_INQUIRY: "Consulta de producto",
  WEB_PROJECT: "Proyecto web",
  COMPLAINT: "Libro de reclamaciones",
};

export const deviceTypeLabel: Record<DeviceType, string> = {
  DESKTOP: "PC de escritorio",
  LAPTOP: "Laptop",
  ALL_IN_ONE: "All-in-One",
  PRINTER: "Impresora",
  MONITOR: "Monitor",
  PERIPHERAL: "Periférico",
  OTHER: "Otro",
};

export const serviceDeliveryModeLabel: Record<ServiceDeliveryMode, string> = {
  PICKUP_AT_STORE: "Recojo en taller",
  HOME_DELIVERY: "Entrega a domicilio",
  COURIER: "Envío por courier",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  WHATSAPP_COORDINATION: "Coordinación por WhatsApp",
  BANK_TRANSFER: "Transferencia bancaria",
  DIGITAL_WALLET: "Billetera digital",
  CASH_ON_PICKUP: "Efectivo al recoger",
  GATEWAY: "Pasarela de pago",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
  REFUNDED: "Reembolsado",
};

export const movementTypeLabel: Record<InventoryMovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Salida",
  ADJUSTMENT: "Ajuste",
  RESERVATION: "Reserva",
  RELEASE: "Liberación",
  SALE: "Venta",
  RETURN: "Devolución",
  SERVICE_USE: "Uso en servicio",
};

export const approvalDecisionLabel: Record<ApprovalDecision, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export const roleLabel: Record<RoleKey, string> = {
  ADMIN: "Administrador",
  TECHNICIAN: "Técnico",
  SALES: "Ventas",
  CUSTOMER: "Cliente",
};
