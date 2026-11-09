import { siteConfig } from "@/config/site";

/** Mensajes contextuales para WhatsApp. */
export const whatsappMessages = {
  general: () => "Hola, deseo información sobre los servicios de ELZIIUS.",
  service: (serviceName: string) =>
    `Hola, deseo solicitar un servicio de ${serviceName.toLowerCase()} con ELZIIUS.`,
  product: (productName: string) =>
    `Hola, estoy interesado en el producto ${productName}. Deseo consultar disponibilidad y modalidades de entrega.`,
  tracking: (code: string) => `Hola, deseo consultar el estado de mi orden ${code}.`,
  order: (code: string, total: string) =>
    `Hola, acabo de registrar el pedido ${code} por ${total} en ELZIIUS. Deseo coordinar la confirmación y la entrega.`,
  webProject: () => "Hola, deseo cotizar el desarrollo de una página web con ELZIIUS.",
};

/** Normaliza el número comercial configurado (solo dígitos). */
export function normalizeWhatsappNumber(n: string | null | undefined) {
  return (n ?? "").replace(/\D/g, "");
}

/**
 * Devuelve el enlace wa.me o null si no hay número configurado.
 * Nunca se inventa un número: sin configuración, la UI muestra un aviso.
 */
export function whatsappLink(message: string, number: string = siteConfig.contact.whatsapp) {
  const n = normalizeWhatsappNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
