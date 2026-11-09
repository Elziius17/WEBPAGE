import { z } from "zod";
import { consentSchema, nameSchema, optionalEmail, optionalText, phoneSchema } from "./common";

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const checkoutSchema = z
  .object({
    idempotencyKey: z.uuid(),
    items: z.array(cartItemSchema).min(1, "Tu carrito está vacío").max(30),
    contactName: nameSchema,
    contactEmail: optionalEmail,
    contactPhone: phoneSchema,
    documentType: z.enum(["DNI", "RUC", "CE", "PASSPORT"]).optional(),
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
  })
  .superRefine((d, ctx) => {
    if (d.deliveryMethod === "COURIER") {
      for (const f of ["line1", "district", "province", "department"] as const) {
        if (!d[f]) ctx.addIssue({ code: "custom", path: [f], message: "Campo obligatorio para envíos" });
      }
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
