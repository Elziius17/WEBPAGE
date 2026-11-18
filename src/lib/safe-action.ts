import type { ActionResult } from "@/lib/actions";

export const STALE_DEPLOY_MESSAGE =
  "Actualizamos la página mientras la tenías abierta. Recárgala (F5) y vuelve a intentarlo; si escribiste algo largo, cópialo antes.";

/** Cuando la página quedó de una publicación anterior, la Server Action ya no existe. */
export function isStaleDeployError(e: unknown) {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /UnrecognizedActionError|Server Action .* was not found|Failed to find Server Action/i.test(
    msg,
  );
}

/**
 * Ejecuta una Server Action desde el navegador. Si falla porque se publicó una versión
 * nueva o se cortó la conexión, devuelve un error legible en vez de romper la página.
 */
export async function safeAction<T>(run: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await run();
  } catch (e) {
    if (isStaleDeployError(e)) return { ok: false, error: STALE_DEPLOY_MESSAGE };
    if (e instanceof TypeError)
      return { ok: false, error: "No pudimos conectar. Revisa tu internet e inténtalo de nuevo." };
    throw e;
  }
}
