import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Verificación optimista: si no hay cookie de sesión, redirige al login.
 * La autorización real (rol + permiso) se valida SIEMPRE en el servidor
 * (páginas, Server Actions y Route Handlers).
 */
export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request);
  if (!cookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mi-cuenta/:path*"],
};
