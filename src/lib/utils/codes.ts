import { randomBytes } from "node:crypto";

/** Alfabeto Crockford Base32 sin caracteres ambiguos (I, L, O, U). */
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Genera `length` caracteres aleatorios criptográficamente seguros. */
export function randomCode(length: number): string {
  // 32 símbolos => 5 bits; usamos un byte por símbolo con rechazo para evitar sesgo.
  let out = "";
  while (out.length < length) {
    const bytes = randomBytes(length * 2);
    for (const b of bytes) {
      if (b < 256 - (256 % CODE_ALPHABET.length)) {
        out += CODE_ALPHABET[b % CODE_ALPHABET.length];
        if (out.length === length) break;
      }
    }
  }
  return out;
}

/** Código público de seguimiento de servicio técnico: EZ-XXXX-XXXX (40 bits). */
export function generateTrackingCode(): string {
  const c = randomCode(8);
  return `EZ-${c.slice(0, 4)}-${c.slice(4)}`;
}

/** Código de pedido comercial: PE-XXXX-XXXX. */
export function generateOrderCode(): string {
  const c = randomCode(8);
  return `PE-${c.slice(0, 4)}-${c.slice(4)}`;
}

/** Normaliza un código ingresado por el usuario (mayúsculas, sin espacios, O→0, I/L→1). */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
}

export const TRACKING_CODE_REGEX = /^EZ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
