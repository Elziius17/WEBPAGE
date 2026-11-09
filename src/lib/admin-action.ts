import "server-only";
import type { z } from "zod";
import { authorize, type CurrentUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/security/permissions";
import {
  formDataToObject,
  handleActionError,
  validationError,
  type ActionResult,
} from "@/lib/actions";

/**
 * Ejecuta una acción administrativa: autoriza (servidor), valida con Zod y
 * traduce errores. Toda acción del panel debe pasar por aquí.
 */
export async function runAdminAction<S extends z.ZodType, T = undefined>(
  permission: Permission,
  schema: S,
  input: FormData | Record<string, unknown>,
  handler: (data: z.output<S>, user: CurrentUser) => Promise<ActionResult<T> | void>,
): Promise<ActionResult<T>> {
  try {
    const user = await authorize(permission);
    const raw = input instanceof FormData ? formDataToObject(input) : input;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return validationError(parsed.error);
    const res = await handler(parsed.data, user);
    return res ?? { ok: true, message: "Cambios guardados." };
  } catch (e) {
    return handleActionError(e);
  }
}
