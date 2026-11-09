import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Ingresa un teléfono válido")
  .max(20, "Teléfono demasiado largo")
  .regex(/^[+\d][\d\s-]{6,19}$/, "Solo números, espacios o guiones");

export const optionalEmail = z
  .union([z.literal(""), z.email("Correo inválido").max(120)])
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined));

export const requiredEmail = z.email("Correo inválido").max(120).transform((v) => v.toLowerCase());

export const nameSchema = z.string().trim().min(2, "Ingresa tu nombre").max(100);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const consentSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal(true)], {
    error: "Debes aceptar la política de privacidad",
  })
  .transform(() => true);

/** Monto en soles (texto o número) -> céntimos. Vacío => undefined. */
export const optionalSolesToCents = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Monto inválido" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

export const requiredSolesToCents = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (v === "" || !Number.isFinite(n) || n <= 0) {
    ctx.addIssue({ code: "custom", message: "Ingresa un monto mayor a 0" });
    return z.NEVER;
  }
  return Math.round(n * 100);
});

export const optionalInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return undefined;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Número entero inválido" });
      return z.NEVER;
    }
    return n;
  });

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === "on" || v === "true" || v === true);

export const idSchema = z.string().min(1).max(40);
