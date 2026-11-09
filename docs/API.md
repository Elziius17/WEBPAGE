# API, Server Actions y Route Handlers

La plataforma no expone una API REST pública general. Las mutaciones usan **Server Actions** (protección de origen integrada) y existen pocos **Route Handlers** específicos.

## Route Handlers

| Método y ruta                            | Acceso                                              | Descripción                                                                                                           |
| ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `GET/POST /api/auth/*`                   | Público                                             | Endpoints de Better Auth (`sign-in/email`, `sign-up/email`, `sign-out`, `get-session`). Con rate limit.               |
| `GET /api/files/{key}`                   | Productos: público · Adjuntos: personal con permiso | Sirve archivos del almacenamiento local. `key` debe cumplir `^(products\|service-orders\|deliveries)/AAAA/uuid.ext$`. |
| `GET /api/admin/service-orders/{id}/pdf` | `service-orders:read` (y alcance del técnico)       | Orden de servicio en PDF. Responde 403 sin sesión o permiso y 404 fuera de alcance.                                   |
| `GET /sitemap.xml`, `GET /robots.txt`    | Público                                             | SEO                                                                                                                   |

## Server Actions públicas (`src/actions/public.ts`)

| Acción                | Entrada (Zod)          | Rate limit       | Resultado                                 |
| --------------------- | ---------------------- | ---------------- | ----------------------------------------- |
| `submitPublicRequest` | `publicRequestSchema`  | 5 / 10 min / IP  | Crea un `ServiceRequest`                  |
| `lookupTracking`      | `trackingLookupSchema` | 10 / 10 min / IP | DTO `PublicTracking` (sin datos internos) |
| `getCartSnapshot`     | `string[]` (hasta 30)  | —                | Precio y disponibilidad actuales          |
| `placeOrder`          | `checkoutSchema`       | 6 / 15 min / IP  | `{ code, totalCents }`                    |
| `submitComplaint`     | `complaintSchema`      | 3 / h / IP       | Código `LR-AAAA-XXXXXXXX`                 |

## Server Actions del panel (`src/actions/admin/*`)

Todas siguen el contrato `(prevState, FormData) => ActionResult`:

```ts
type ActionResult<T> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

| Archivo             | Acciones                                                                                                                              | Permiso                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `service-orders.ts` | crear/editar orden, transición, nota, diagnóstico, presupuesto, aprobación, actividad, repuesto, control de calidad, cierre, adjuntos | `service-orders:write` (asignación: `service-orders:assign`)          |
| `catalog.ts`        | producto (guardar, eliminar o archivar, imágenes), movimiento de inventario, proveedor, categoría, servicio                           | `products:*`, `inventory:write`, `suppliers:write`, `services:write`  |
| `commerce.ts`       | estado de pedido, pago verificado, datos y estado de entrega, comprobante, courier, zona                                              | `orders:write`, `deliveries:write`                                    |
| `management.ts`     | cliente, solicitud, usuario y rol, configuración, checklist de calidad, testimonios                                                   | `customers:write`, `requests:write`, `users:manage`, `settings:write` |

## Integraciones futuras

- **Pasarela de pago**: crear un proveedor que registre `Payment` con `method = GATEWAY` y lo marque `VERIFIED` solo tras el webhook firmado del proveedor.
- **Courier**: implementar la consulta del proveedor y registrar eventos en `ShipmentTracking`. Hoy se usa `Courier.trackingUrlTemplate` con `{code}`.
- **Notificaciones**: consumir `Notification` (estado `PENDING`) con un proveedor SMTP o la API de WhatsApp Business.
