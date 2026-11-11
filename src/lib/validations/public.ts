import { z } from "zod";
import {
  consentSchema,
  nameSchema,
  optionalEmail,
  optionalEnum,
  optionalText,
  phoneSchema,
  requiredEmail,
} from "./common";

export const requestKinds = [
  "SERVICE",
  "QUOTE",
  "CONTACT",
  "PRODUCT_INQUIRY",
  "WEB_PROJECT",
  "COMPLAINT",
] as const;

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
  preferredContact: optionalEnum(["WHATSAPP", "PHONE", "EMAIL"]),
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

export const complaintSchema = z.object({
  type: z.enum(["RECLAMO", "QUEJA"]),
  name: nameSchema,
  documentType: z.enum(["DNI", "CE", "PASSPORT", "RUC"]),
  documentNumber: z.string().trim().min(6, "Documento inválido").max(15),
  address: z.string().trim().min(5, "Ingresa tu domicilio").max(200),
  phone: phoneSchema,
  email: requiredEmail,
  guardian: optionalText(120),
  goodType: z.enum(["PRODUCTO", "SERVICIO"]),
  amount: optionalText(20),
  goodDescription: z.string().trim().min(3, "Describe el producto o servicio").max(300),
  detail: z.string().trim().min(10, "Describe el detalle (mínimo 10 caracteres)").max(2000),
  request: z.string().trim().min(5, "Indica tu pedido").max(1000),
  consent: consentSchema,
  website: z.string().max(0).optional(),
});
export type ComplaintInput = z.input<typeof complaintSchema>;

/** Testimonio enviado por un cliente registrado (queda pendiente de moderación). */
export const customerTestimonialSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "Indica cómo quieres que aparezca tu nombre")
    .max(60, "Máximo 60 caracteres"),
  authorRole: optionalText(80),
  rating: z.coerce.number().int().min(1, "Elige una valoración").max(5, "Elige una valoración"),
  content: z
    .string()
    .trim()
    .min(20, "Cuéntanos un poco más (mínimo 20 caracteres)")
    .max(600, "Máximo 600 caracteres"),
  consent: z
    .unknown()
    .refine((v) => v === true || v === "on" || v === "true", {
      message: "Debes autorizar la publicación de tu opinión",
    })
    .transform(() => true as const),
});
export type CustomerTestimonialInput = z.input<typeof customerTestimonialSchema>;
