import "server-only";
import { z } from "zod";
import { AuthorizationError } from "@/lib/auth/session";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/** Error de negocio con mensaje seguro para mostrar al usuario. */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

/** Convierte FormData en objeto plano (los campos repetidos se agrupan en arrays). */
export function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (value instanceof File) continue;
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else out[key] = value;
  }
  return out;
}

export function validationError(error: z.ZodError): ActionResult<never> {
  const flat = z.flattenError(error);
  return {
    ok: false,
    error: "Revisa los campos marcados.",
    fieldErrors: flat.fieldErrors as FieldErrors,
  };
}

/** Traduce excepciones a un ActionResult sin filtrar detalles internos. */
export function handleActionError(err: unknown): ActionResult<never> {
  if (err instanceof AuthorizationError || err instanceof BusinessError) {
    return { ok: false, error: err.message };
  }
  if (err instanceof z.ZodError) return validationError(err);
  // Errores de redirect/notFound de Next deben propagarse.
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[action]", err);
  return { ok: false, error: "Ocurrió un error inesperado. Inténtalo nuevamente." };
}
