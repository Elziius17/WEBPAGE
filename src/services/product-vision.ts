import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { AiUnavailableError, VISION_MODEL, getAiClient } from "@/lib/ai/client";

export type VisionImage = {
  data: Uint8Array;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
};

/** Campos que la IA puede marcar como dudosos (coinciden con los del formulario). */
export const DRAFT_FIELDS = [
  "name",
  "brand",
  "model",
  "category",
  "condition",
  "specs",
  "description",
  "warranty",
] as const;

function buildSchema(categorySlugs: [string, ...string[]]) {
  return z.object({
    recognized: z
      .boolean()
      .describe("true si las fotos muestran un producto informático identificable"),
    name: z
      .string()
      .describe(
        "Nombre comercial claro y conciso en español, p. ej. 'Monitor LG 24\" IPS Full HD'",
      ),
    brand: z.string().describe("Marca. Cadena vacía si no es visible"),
    model: z
      .string()
      .describe("Modelo o número de parte tal como aparece. Cadena vacía si no es visible"),
    categorySlug: z
      .enum([...categorySlugs, "otro"])
      .describe("Categoría de la tienda que mejor corresponde"),
    condition: z.enum(["NEW", "REFURBISHED", "USED", "UNKNOWN"]),
    shortDescription: z.string().describe("Una frase de venta, máximo 160 caracteres"),
    description: z
      .string()
      .describe("2 a 4 frases profesionales en español, sin exagerar ni inventar características"),
    specs: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          source: z
            .enum(["visible", "inferido"])
            .describe("visible = leído en la foto; inferido = deducido del modelo"),
        }),
      )
      .describe("Especificaciones técnicas, etiquetas en español"),
    warrantyMonths: z
      .number()
      .int()
      .nullable()
      .describe("Solo si la garantía aparece en la foto; si no, null"),
    uncertainFields: z
      .array(z.enum(DRAFT_FIELDS))
      .describe("Campos que el personal debe verificar"),
    notes: z
      .string()
      .describe("Observaciones breves para el personal (en español). Cadena vacía si no hay"),
  });
}

export type ProductDraft = z.infer<ReturnType<typeof buildSchema>>;

const SYSTEM = `Eres el asistente de catálogo de ELZIIUS, una tienda de tecnología en Perú.
Recibes fotos de un producto (equipo, etiqueta o caja) y preparas la ficha para la tienda.
Reglas:
- Lee con atención etiquetas, placas y textos de la caja: marca, modelo, número de parte, capacidad, potencia, velocidades.
- No inventes datos. Si un dato no es visible y no puedes deducirlo con seguridad del número de modelo, omítelo o márcalo en uncertainFields.
- Las especificaciones deducidas del modelo (no visibles) van con source "inferido" y su campo en uncertainFields incluye "specs".
- Nunca indiques precios ni stock.
- Condición: NEW solo si se ve sellado o en caja nueva; si no puedes saberlo, UNKNOWN.
- Redacta en español neutro y profesional, sin superlativos ni promesas que no consten.
- Si las fotos no muestran un producto informático, responde recognized=false y explica en notes.`;

/** Analiza las fotos y devuelve un borrador de ficha validado. */
export async function extractProductDraft(
  images: VisionImage[],
  categories: { slug: string; name: string }[],
) {
  if (!images.length) throw new Error("Sin imágenes");
  const slugs = categories.map((c) => c.slug);
  if (!slugs.length) throw new Error("No hay categorías configuradas");
  const schema = buildSchema(slugs as [string, ...string[]]);
  const client = await getAiClient();

  const content: Anthropic.ContentBlockParam[] = [
    ...images.map((img): Anthropic.ImageBlockParam => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: Buffer.from(img.data).toString("base64"),
      },
    })),
    {
      type: "text",
      text: `Categorías disponibles: ${categories.map((c) => `${c.slug} (${c.name})`).join(", ")}.\nPrepara la ficha del producto de estas fotos.`,
    },
  ];

  try {
    const response = await client.messages.parse({
      model: VISION_MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { effort: "medium", format: zodOutputFormat(schema) },
    });
    if (response.stop_reason === "refusal") {
      throw new AiUnavailableError("La IA no pudo procesar estas fotos. Usa el registro manual.");
    }
    if (!response.parsed_output) {
      throw new AiUnavailableError(
        "La IA no devolvió una ficha válida. Inténtalo con fotos más nítidas o usa el registro manual.",
      );
    }
    return { draft: response.parsed_output, usage: response.usage };
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    if (err instanceof Anthropic.APIError) {
      console.error("[ai] AI Gateway", err.status, err.message);
      if (err.status === 402 || err.status === 429) {
        throw new AiUnavailableError(
          "Se agotó el crédito gratuito de IA de este periodo o hay demasiadas solicitudes. Usa el registro manual; el crédito se renueva cada 30 días.",
        );
      }
      if (err.status === 401 || err.status === 403) {
        throw new AiUnavailableError(
          "La IA no está habilitada para este proyecto en Vercel. Usa el registro manual.",
        );
      }
      throw new AiUnavailableError(
        "El servicio de IA no respondió correctamente. Inténtalo nuevamente o usa el registro manual.",
      );
    }
    throw err;
  }
}
