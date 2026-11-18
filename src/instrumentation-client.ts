import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/observability/sentry-options";
import { initAnalytics } from "@/lib/observability/analytics";

try {
  if (baseSentryOptions.dsn) Sentry.init(baseSentryOptions);
} catch {
  // El monitoreo nunca debe romper la web.
}

try {
  initAnalytics();
} catch {
  // idem
}

/** Evento que escucha la barra de progreso de navegación (RouteProgress). */
export const ROUTE_START_EVENT = "elziius:route-start";

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  try {
    window.dispatchEvent(new CustomEvent(ROUTE_START_EVENT, { detail: { url } }));
  } catch {
    // nunca bloquear la navegación
  }
  Sentry.captureRouterTransitionStart(url, navigationType);
}
