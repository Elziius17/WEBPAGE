import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import type { RoleKey } from "@/generated/prisma/enums";
import { hasPermission, isStaff, type Permission } from "@/lib/security/permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
};

/** Usuario autenticado y activo, o null. Memorizado por petición. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    // Un error de configuración de autenticación no debe tumbar el sitio público:
    // se registra y el visitante se trata como anónimo (las zonas privadas siguen cerradas).
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[auth] No se pudo leer la sesión:", err instanceof Error ? err.message : err);
    return null;
  }
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string; active?: boolean };
  if (u.active === false) return null;
  return { id: u.id, name: u.name, email: u.email, role: (u.role ?? "CUSTOMER") as RoleKey };
});

export class AuthorizationError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Para páginas: exige sesión; si no, redirige a /login. */
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

/** Para páginas del panel: exige rol de personal y el permiso indicado. */
export async function requireStaffPage(
  permission: Permission,
  next = "/admin",
): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (!isStaff(user.role)) redirect("/mi-cuenta");
  if (!hasPermission(user.role, permission)) redirect("/admin/acceso-denegado");
  return user;
}

/** Para Server Actions / Route Handlers: lanza AuthorizationError si no autorizado. */
export async function authorize(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Tu sesión expiró. Vuelve a iniciar sesión.");
  if (!hasPermission(user.role, permission)) throw new AuthorizationError();
  return user;
}
