import { z } from "zod";
import {
  consentSchema,
  nameSchema,
  optionalEmail,
  optionalEnum,
  optionalText,
  phoneSchema,
} from "./common";

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(20),
});

const checkoutBase = z.object({
  idempotencyKey: z.uuid(),
  items: z.array(cartItemSchema).min(1, "Tu carrito está vacío").max(30),
  contactName: nameSchema,
  contactEmail: optionalEmail,
  contactPhone: phoneSchema,
  documentType: optionalEnum(["DNI", "RUC", "CE", "PASSPORT"]),
  documentNumber: optionalText(15),
  deliveryMethod: z.enum(["PICKUP", "COURIER"]),
  // Dirección (solo courier)
  recipientName: optionalText(100),
  line1: optionalText(200),
  line2: optionalText(200),
  district: optionalText(80),
  province: optionalText(80),
  department: optionalText(80),
  reference: optionalText(200),
  zoneId: optionalText(40),
  customerNotes: optionalText(800),
  consent: consentSchema,
});

function requireAddress(
  d: {
    deliveryMethod: "PICKUP" | "COURIER";
    line1?: string;
    district?: string;
    province?: string;
    department?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (d.deliveryMethod === "COURIER") {
    for (const f of ["line1", "district", "province", "department"] as const) {
      if (!d[f])
        ctx.addIssue({ code: "custom", path: [f], message: "Campo obligatorio para envíos" });
    }
  }
}

/** Esquema autoritativo (servidor). */
export const checkoutSchema = checkoutBase.superRefine(requireAddress);

/** Esquema del formulario (los ítems provienen del carrito, no del formulario). */
export const checkoutFormSchema = checkoutBase
  .omit({ items: true, idempotencyKey: true })
  .superRefine(requireAddress);

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
