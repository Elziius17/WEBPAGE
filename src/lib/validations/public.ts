import { z } from "zod";
import { consentSchema, nameSchema, optionalEmail, optionalText, phoneSchema, requiredEmail } from "./common";

export const requestKinds = ["SERVICE", "QUOTE", "CONTACT", "PRODUCT_INQUIRY", "WEB_PROJECT", "COMPLAINT"] as const;

export const publicRequestSchema = z.object({
  kind: z.enum(requestKinds),
  name: nameSchema,
  email: optionalEmail,
  phone: phoneSchema,
  company: optionalText(120),
  serviceSlug: optionalText(80),
  productSlug: optionalText(120),
  deviceType: optionalText(60),
  subject: optionalText(150),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(2000),
  preferredContact: z.enum(["WHATSAPP", "PHONE", "EMAIL"]).optional(),
  consent: consentSchema,
  /** Campo trampa anti-bots: debe llegar vacío. */
  website: z.string().max(0).optional(),
});
export type PublicRequestInput = z.input<typeof publicRequestSchema>;

export const trackingLookupSchema = z.object({
  code: z.string().trim().min(6, "Ingresa el código de tu orden").max(20),
  verifier: z.string().trim().min(5, "Ingresa el correo o teléfono registrado").max(120),
});
export type TrackingLookupInput = z.input<typeof trackingLookupSchema>;

export const registerSchema = z
  .object({
    name: nameSchema,
    email: requiredEmail,
    phone: phoneSchema,
    password: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(128)
      .regex(/[A-Za-z]/, "Incluye al menos una letra")
      .regex(/\d/, "Incluye al menos un número"),
    confirmPassword: z.string(),
    consent: consentSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: requiredEmail,
  password: z.string().min(1, "Ingresa tu contraseña").max(128),
});
export type LoginInput = z.input<typeof loginSchema>;
