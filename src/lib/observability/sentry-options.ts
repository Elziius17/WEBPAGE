import type { ErrorEvent } from "@sentry/nextjs";

/** DSN público de Sentry (vacío = monitoreo desactivado). */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /\b(?:\+?51)?9\d{8}\b/g;

/** Quita datos personales antes de enviar un evento (Ley 29733). */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) event.user = { id: event.user.id };
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
  }
  const clean = (s?: string) => s?.replace(EMAIL, "[correo]").replace(PHONE, "[teléfono]");
  if (event.message) event.message = clean(event.message);
  for (const ex of event.exception?.values ?? []) ex.value = clean(ex.value);
  return event;
}

export const baseSentryOptions = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN) && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  beforeSend: scrubEvent,
};
