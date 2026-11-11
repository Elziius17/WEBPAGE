import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getVercelOidcToken } from "@vercel/oidc";

/**
 * Cliente de Claude a través de Vercel AI Gateway.
 * En Vercel se autentica automáticamente con el token OIDC del proyecto
 * (usa los créditos de AI Gateway de la cuenta, sin claves adicionales).
 * Fuera de Vercel puede usarse AI_GATEWAY_API_KEY.
 */
export const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh";
export const VISION_MODEL = "anthropic/claude-opus-5.5";

/**
 * Interruptor del registro de productos con foto (IA). Desactivado por defecto:
 * para reactivarlo, define ENABLE_PRODUCT_AI=true en Vercel (requiere tarjeta
 * verificada en AI Gateway; ver docs/AI.md).
 */
export function isProductAiEnabled() {
  return process.env.ENABLE_PRODUCT_AI === "true";
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

export async function getAiClient(): Promise<Anthropic> {
  let apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    try {
      apiKey = await getVercelOidcToken();
    } catch {
      throw new AiUnavailableError(
        "La lectura con IA solo está disponible en el sitio publicado en Vercel. Usa el registro manual.",
      );
    }
  }
  return new Anthropic({ apiKey, baseURL: AI_GATEWAY_URL, maxRetries: 1, timeout: 90_000 });
}
