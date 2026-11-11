import { z } from "zod";
import {
  checkbox,
  idSchema,
  nameSchema,
  optionalEmail,
  optionalEnum,
  optionalInt,
  optionalSolesToCents,
  optionalText,
  phoneSchema,
  requiredSolesToCents,
} from "./common";

const deviceTypes = [
  "DESKTOP",
  "LAPTOP",
  "ALL_IN_ONE",
  "PRINTER",
  "MONITOR",
  "PERIPHERAL",
  "OTHER",
] as const;
const deliveryModes = ["PICKUP_AT_STORE", "HOME_DELIVERY", "COURIER"] as const;
const datetimeLocal = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(`${v.length === 10 ? `${v}T12:00` : v}:00-05:00`);
    if (Number.isNaN(+d)) {
      ctx.addIssue({ code: "custom", message: "Fecha inválida" });
      return z.NEVER;
    }
    return d;
  });

export const receptionSchema = z
  .object({
    customerId: optionalText(40),
    customerName: optionalText(100),
    customerPhone: optionalText(20),
    customerEmail: optionalEmail,
    documentType: optionalEnum(["DNI", "RUC", "CE", "PASSPORT"]),
    documentNumber: optionalText(15),
    serviceId: optionalText(40),
    technicianId: optionalText(40),
    deviceType: z.enum(deviceTypes),
    brand: z.string().trim().min(1, "Indica la marca").max(60),
    model: optionalText(80),
    serialNumber: optionalText(80),
    accessories: optionalText(500),
    physicalCondition: optionalText(1000),
    reportedIssue: z.string().trim().min(5, "Describe el problema reportado").max(2000),
    accessProvided: checkbox,
    dataBackupAuthorized: checkbox,
    deliveryMode: z.enum(deliveryModes),
    estimatedReadyAt: datetimeLocal,
    receivedAt: datetimeLocal,
    publicNotes: optionalText(1000),
    internalNotes: optionalText(2000),
  })
  .superRefine((d, ctx) => {
    if (!d.customerId) {
      if (!d.customerName || d.customerName.length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["customerName"],
          message: "Nombre del cliente requerido",
        });
      if (!d.customerPhone || !phoneSchema.safeParse(d.customerPhone).success)
        ctx.addIssue({
          code: "custom",
          path: ["customerPhone"],
          message: "Teléfono válido requerido",
        });
    }
  });

export const serviceOrderEditSchema = z.object({
  orderId: idSchema,
  serviceId: optionalText(40),
  technicianId: optionalText(40),
  deviceType: z.enum(deviceTypes),
  brand: z.string().trim().min(1).max(60),
  model: optionalText(80),
  serialNumber: optionalText(80),
  accessories: optionalText(500),
  physicalCondition: optionalText(1000),
  reportedIssue: z.string().trim().min(5).max(2000),
  deliveryMode: z.enum(deliveryModes),
  estimatedReadyAt: datetimeLocal,
  publicNotes: optionalText(1000),
  internalNotes: optionalText(2000),
  accessProvided: checkbox,
  dataBackupAuthorized: checkbox,
});

export const transitionSchema = z.object({
  orderId: idSchema,
  to: z.enum([
    "REQUESTED",
    "RECEIVED",
    "IN_DIAGNOSIS",
    "QUOTE_SENT",
    "PENDING_APPROVAL",
    "APPROVED",
    "IN_REPAIR",
    "IN_TESTING",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: optionalText(1000),
  isPublic: checkbox,
});

export const noteSchema = z.object({
  orderId: idSchema,
  note: z.string().trim().min(2).max(1000),
  isPublic: checkbox,
});

export const diagnosisSchema = z.object({
  orderId: idSchema,
  findings: z.string().trim().min(3, "Indica las fallas identificadas").max(2000),
  testsPerformed: optionalText(2000),
  affectedComponents: optionalText(1000),
  technicalDiagnosis: z.string().trim().min(3, "Diagnóstico requerido").max(3000),
  publicSummary: optionalText(1000),
  budgetCents: optionalSolesToCents,
  estimatedTime: optionalText(120),
  recommendations: optionalText(1500),
});

export const quoteSchema = z.object({
  orderId: idSchema,
  budgetCents: requiredSolesToCents,
  description: z.string().trim().min(3, "Describe el trabajo presupuestado").max(1500),
  sentVia: optionalText(60),
});

export const approvalDecisionSchema = z.object({
  approvalId: idSchema,
  decision: z.enum(["APPROVED", "REJECTED"]),
  evidence: z.string().trim().min(3, "Registra la evidencia de la respuesta del cliente").max(1000),
  respondedAt: datetimeLocal,
});

export const repairTaskSchema = z.object({
  orderId: idSchema,
  description: z.string().trim().min(3).max(1500),
  notes: optionalText(1500),
});

export const partSchema = z
  .object({
    orderId: idSchema,
    name: optionalText(150),
    quantity: z.coerce.number().int().min(1).max(50),
    productId: optionalText(40),
    unitPriceCents: optionalSolesToCents,
    serialNumber: optionalText(80),
    fromInventory: checkbox,
  })
  .superRefine((d, ctx) => {
    if (d.fromInventory && !d.productId)
      ctx.addIssue({ code: "custom", path: ["productId"], message: "Selecciona el producto" });
    if (!d.fromInventory && !d.name)
      ctx.addIssue({ code: "custom", path: ["name"], message: "Indica el repuesto" });
  });

export const closeSchema = z.object({
  orderId: idSchema,
  finalResult: z.string().trim().min(3, "Indica el resultado final").max(2000),
  warrantyDays: optionalInt,
  warrantyTerms: optionalText(1000),
  closingRecommendations: optionalText(1500),
  customerConformity: checkbox,
  conformityNotes: optionalText(1000),
  deliveredAt: datetimeLocal,
});

// --- Productos ---
export const productSchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(3, "Nombre requerido").max(150),
  sku: z
    .string()
    .trim()
    .min(2, "SKU requerido")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Solo letras, números, guiones y puntos")
    .transform((v) => v.toUpperCase()),
  slug: optionalText(120),
  brand: z.string().trim().min(1, "Marca requerida").max(60),
  model: optionalText(80),
  categoryId: idSchema,
  supplierId: optionalText(40),
  shortDescription: optionalText(300),
  description: z.string().trim().min(10, "Descripción mínima de 10 caracteres").max(5000),
  specs: z.string().max(5000).optional().default(""),
  priceCents: requiredSolesToCents,
  compareAtPriceCents: optionalSolesToCents,
  costCents: optionalSolesToCents,
  minStock: z.coerce.number().int().min(0).max(10000).default(1),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"]),
  condition: z.enum(["NEW", "REFURBISHED", "USED"]),
  featured: checkbox,
  warrantyMonths: z.coerce.number().int().min(0).max(120).default(0),
  warrantyNotes: optionalText(500),
  weightGrams: optionalInt,
  /** Solo al crear: stock inicial, registrado como movimiento de entrada. */
  initialStock: optionalInt,
  /** Solo al crear: fotos ya subidas por el registro con IA. */
  pendingImageKeys: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) =>
      v === undefined || v === "" ? [] : (Array.isArray(v) ? v : [v]).filter(Boolean).slice(0, 4),
    ),
});

export const movementSchema = z.object({
  productId: idSchema,
  type: z.enum(["ENTRY", "EXIT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int().min(0).max(100000),
  reason: optionalText(300),
  reference: optionalText(100),
  unitCostCents: optionalSolesToCents,
  supplierId: optionalText(40),
});

export const supplierSchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2).max(120),
  ruc: z
    .union([z.literal(""), z.string().regex(/^\d{11}$/, "RUC de 11 dígitos")])
    .optional()
    .transform((v) => v || undefined),
  contactName: optionalText(100),
  phone: optionalText(20),
  email: optionalEmail,
  address: optionalText(200),
  notes: optionalText(1000),
  active: checkbox,
});

export const categorySchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2).max(80),
  slug: optionalText(80),
  description: optionalText(300),
  icon: optionalText(40),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: checkbox,
});

// --- Servicios ---
export const serviceSchema = z.object({
  id: optionalText(40),
  code: z.string().trim().min(1).max(4),
  name: z.string().trim().min(3).max(100),
  slug: optionalText(100),
  icon: z.string().trim().max(40).default("wrench"),
  shortDescription: z.string().trim().min(10).max(250),
  description: z.string().trim().min(20).max(4000),
  benefits: z.string().max(4000).default(""),
  activities: z.string().max(4000).default(""),
  procedure: z.string().max(4000).default(""),
  estimatedTime: optionalText(120),
  referencePriceCents: optionalSolesToCents,
  priceNote: optionalText(200),
  whatsappMessage: optionalText(300),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: checkbox,
});

// --- Pedidos y entregas ---
export const orderStatusSchema = z.object({
  orderId: idSchema,
  to: z.enum(["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
  note: optionalText(500),
  shippingCents: optionalSolesToCents,
});

export const paymentSchema = z.object({
  orderId: idSchema,
  method: z.enum([
    "WHATSAPP_COORDINATION",
    "BANK_TRANSFER",
    "DIGITAL_WALLET",
    "CASH_ON_PICKUP",
    "GATEWAY",
  ]),
  amountCents: requiredSolesToCents,
  reference: z.string().trim().min(3, "Indica la referencia de la operación verificada").max(120),
  notes: optionalText(500),
});

export const deliveryUpdateSchema = z.object({
  deliveryId: idSchema,
  courierId: optionalText(40),
  zoneId: optionalText(40),
  trackingNumber: optionalText(80),
  costCents: optionalSolesToCents,
  weightGrams: optionalInt,
  lengthCm: optionalInt,
  widthCm: optionalInt,
  heightCm: optionalInt,
  pickupLocation: optionalText(200),
  scheduledAt: datetimeLocal,
  receivedBy: optionalText(100),
  notes: optionalText(1000),
});

export const deliveryStatusSchema = z.object({
  deliveryId: idSchema,
  to: z.enum([
    "PENDING_COORDINATION",
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "DISPATCHED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "INCIDENT",
    "CANCELLED",
  ]),
  description: optionalText(500),
  location: optionalText(120),
});

export const courierSchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2).max(80),
  website: z
    .union([z.literal(""), z.url()])
    .optional()
    .transform((v) => v || undefined),
  phone: optionalText(30),
  trackingUrlTemplate: optionalText(300),
  notes: optionalText(500),
  active: checkbox,
});

export const zoneSchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2).max(80),
  description: optionalText(300),
  baseCostCents: optionalSolesToCents,
  costIsMinimum: checkbox,
  estimatedTime: optionalText(80),
  active: checkbox,
});

// --- Clientes / usuarios ---
export const customerSchema = z.object({
  id: optionalText(40),
  fullName: nameSchema,
  type: z.enum(["PERSON", "COMPANY"]),
  companyName: optionalText(120),
  documentType: optionalEnum(["DNI", "RUC", "CE", "PASSPORT"]),
  documentNumber: optionalText(15),
  email: optionalEmail,
  phone: phoneSchema,
  internalNotes: optionalText(2000),
});

export const staffUserSchema = z.object({
  name: nameSchema,
  email: z
    .email()
    .max(120)
    .transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "TECHNICIAN", "SALES"]),
  password: z.string().min(10, "Mínimo 10 caracteres").max(128),
});

export const userRoleSchema = z.object({
  userId: idSchema,
  role: z.enum(["ADMIN", "TECHNICIAN", "SALES", "CUSTOMER"]),
  active: checkbox,
});

export const requestUpdateSchema = z.object({
  requestId: idSchema,
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
  handledNotes: optionalText(1000),
});

export const testimonialSchema = z.object({
  id: optionalText(40),
  authorName: z.string().trim().min(2).max(100),
  authorRole: optionalText(100),
  content: z.string().trim().min(10).max(800),
  rating: z.coerce.number().int().min(1).max(5),
  approved: checkbox,
});
