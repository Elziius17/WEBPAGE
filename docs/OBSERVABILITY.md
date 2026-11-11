# Observabilidad: Sentry y PostHog

Ambos se activan solo en producción y solo si existen sus variables. Sin ellas la web funciona igual.

| Variable | Dónde | Secreta |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (production, preview) | No |
| `NEXT_PUBLIC_POSTHOG_KEY` | Vercel (production, preview) | No |
| `SENTRY_AUTH_TOKEN` | Vercel, solo si se quieren source maps legibles | **Sí** |

## Sentry (errores)

- `src/instrumentation.ts` (servidor) y `src/instrumentation-client.ts` (navegador).
- `src/lib/observability/sentry-options.ts`: `sendDefaultPii: false` y `scrubEvent`, que quita cookies, cuerpo de las peticiones, correos y teléfonos.
- Los eventos del navegador llegan por `/monitoring` (mismo dominio), que reenvía `src/app/sentry-tunnel/route.ts` sin cookies.
- Organización `elziius`, proyecto `elziius-web`.

## PostHog (analítica con consentimiento)

- `src/lib/observability/analytics.ts`: no se inicializa hasta que el visitante pulsa **Aceptar** en el aviso (`src/components/layout/cookie-consent.tsx`). La elección se guarda en `localStorage` y se cambia desde «Preferencias de cookies» en el pie de página.
- Se descartan eventos de `/admin`, `/mi-cuenta`, `/login`, `/registro` y `/api`. Las grabaciones ocultan todos los campos de formulario y cualquier elemento con `data-private`.
- Los eventos pasan por `/ingest` (reescrito en `next.config.ts` a `us.i.posthog.com`), así la CSP sigue en `connect-src 'self'`.
