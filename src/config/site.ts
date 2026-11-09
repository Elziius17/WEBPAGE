/**
 * Configuración base del sitio. Los datos de contacto provienen de variables de
 * entorno públicas y pueden sobrescribirse desde Admin > Configuración.
 * No se inventan datos: si una variable está vacía, la UI oculta el dato.
 */
export const siteConfig = {
  name: "ELZIIUS",
  legalName: "ELZIIUS",
  tagline: "Soporte • Hardware • Web",
  headline: "La tecnología que necesitas, las soluciones que mereces.",
  description:
    "En ELZIIUS transformamos necesidades tecnológicas en soluciones reales. Ofrecemos soporte técnico especializado, mantenimiento informático, venta de componentes y desarrollo de páginas web para particulares y empresas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es-PE",
  country: "PE",
  currency: "PEN",
  timeZone: "America/Lima",
  contact: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  },
} as const;

export const publicNav = [
  { href: "/servicios", label: "Servicios" },
  { href: "/tienda", label: "Tienda" },
  { href: "/desarrollo-web", label: "Desarrollo web" },
  { href: "/protocolos", label: "Protocolos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const legalNav = [
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/garantias", label: "Política de garantías" },
  { href: "/legal/cambios-devoluciones", label: "Cambios y devoluciones" },
  { href: "/legal/entregas", label: "Política de entregas" },
] as const;
