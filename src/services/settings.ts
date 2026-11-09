import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";

/** Configuración del negocio editable desde Admin > Configuración. */
export const businessSettingsSchema = z.object({
  commercialName: z.string().trim().min(2).max(80),
  ruc: z.string().trim().max(11).optional().default(""),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{0,15}$/, "Solo dígitos, formato internacional sin + (p.ej. 51987654321)")
    .optional()
    .default(""),
  email: z
    .union([z.literal(""), z.email("Correo inválido")])
    .optional()
    .default(""),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  schedule: z.string().trim().max(300).optional().default(""),
  pickupInstructions: z.string().trim().max(500).optional().default(""),
  courierNotes: z.string().trim().max(500).optional().default(""),
  serviceWarrantyDays: z.coerce.number().int().min(0).max(365).optional().default(0),
  warrantyText: z.string().trim().max(1500).optional().default(""),
  facebook: z
    .union([z.literal(""), z.url()])
    .optional()
    .default(""),
  instagram: z
    .union([z.literal(""), z.url()])
    .optional()
    .default(""),
  tiktok: z
    .union([z.literal(""), z.url()])
    .optional()
    .default(""),
});

export type BusinessSettings = z.infer<typeof businessSettingsSchema>;

export const DEFAULT_QC_TEMPLATE = [
  "Encendido",
  "Temperaturas",
  "Memoria RAM",
  "Almacenamiento",
  "Conectividad",
  "Periféricos",
  "Estabilidad",
  "Funcionamiento general",
];

const defaults: BusinessSettings = {
  commercialName: siteConfig.name,
  ruc: "",
  whatsapp: siteConfig.contact.whatsapp.replace(/\D/g, ""),
  email: siteConfig.contact.email,
  phone: siteConfig.contact.phone,
  address: "",
  city: "",
  schedule: "",
  pickupInstructions: "",
  courierNotes: "",
  serviceWarrantyDays: 0,
  warrantyText: "",
  facebook: "",
  instagram: "",
  tiktok: "",
};

export const getBusinessSettings = cache(async (): Promise<BusinessSettings> => {
  try {
    const row = await db.businessConfiguration.findUnique({ where: { key: "business" } });
    if (!row) return defaults;
    const parsed = businessSettingsSchema.partial().safeParse(row.value);
    const merged = { ...defaults, ...(parsed.success ? parsed.data : {}) };
    // Las variables de entorno sirven de respaldo si el panel aún no define el dato.
    if (!merged.whatsapp) merged.whatsapp = defaults.whatsapp;
    if (!merged.email) merged.email = defaults.email;
    if (!merged.phone) merged.phone = defaults.phone;
    return merged;
  } catch {
    return defaults;
  }
});

export const getQcTemplate = cache(async (): Promise<string[]> => {
  const row = await db.businessConfiguration.findUnique({ where: { key: "qc.template" } });
  const parsed = z.array(z.string().min(1)).min(1).safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_QC_TEMPLATE;
});

/** Subconjunto seguro para enviar al cliente (componentes públicos). */
export type PublicBusinessInfo = Pick<
  BusinessSettings,
  | "commercialName"
  | "whatsapp"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "schedule"
  | "facebook"
  | "instagram"
  | "tiktok"
>;

export async function getPublicBusinessInfo(): Promise<PublicBusinessInfo> {
  const s = await getBusinessSettings();
  return {
    commercialName: s.commercialName,
    whatsapp: s.whatsapp,
    email: s.email,
    phone: s.phone,
    address: s.address,
    city: s.city,
    schedule: s.schedule,
    facebook: s.facebook,
    instagram: s.instagram,
    tiktok: s.tiktok,
  };
}
