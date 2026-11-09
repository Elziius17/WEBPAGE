# Arquitectura

## Visión general

Monolito modular en **Next.js 16 (App Router)**. Frontend y backend conviven en el mismo proyecto, con capas separadas:

```
Navegador
  │  React Server Components (HTML) + Client Components (interacción)
  │  Formularios: React Hook Form + Zod (validación de experiencia de usuario)
  ▼
Server Actions (src/actions/**) · Route Handlers (src/app/api/**)
  │  1. Autenticación (Better Auth)   2. Autorización por permiso (RBAC)
  │  3. Rate limiting                 4. Validación Zod en servidor (autoritativa)
  ▼
Servicios de dominio (src/services/**)
  │  Reglas de negocio, máquinas de estado, transacciones con bloqueo de fila
  ▼
Prisma 7 (adaptador pg) → PostgreSQL 16        Almacenamiento (local / S3 compatible)
```

## Decisiones principales

| Decisión                                                             | Motivo                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js sin Cache Components** (`cacheComponents` desactivado)     | El panel y la tienda dependen de datos en tiempo real y de la sesión. El renderizado dinámico (`force-dynamic`) es predecible y permite compilar sin base de datos. |
| **Server Actions** para mutaciones                                   | Protección CSRF integrada (verificación de origen), tipado de extremo a extremo y sin API pública innecesaria.                                                      |
| **Better Auth** en lugar de Auth.js                                  | Auth.js pasó a modo mantenimiento; Better Auth es la alternativa mantenida, con adaptador Prisma, hash scrypt, sesiones en BD y rate limiting.                      |
| **Permisos definidos en código** (`src/lib/security/permissions.ts`) | Fuente única y auditable; el seed los sincroniza con las tablas `Role`, `Permission` y `RolePermission` para consulta.                                              |
| **Montos en céntimos (Int)**                                         | Evita errores de coma flotante en PEN.                                                                                                                              |
| **Stock + reservas**                                                 | `stock` es físico y `reserved` lo comprometido por pedidos confirmados. Disponible = `stock - reserved`.                                                            |
| **`SELECT … FOR UPDATE`** en pedidos e inventario                    | Evita la sobreventa con operaciones concurrentes (probado en integración).                                                                                          |
| **Restricciones `CHECK`** en la migración                            | Defensa en profundidad: la BD rechaza stock negativo aunque falle la capa de servicio.                                                                              |
| **Claves de idempotencia** en el checkout                            | Un doble clic o un reintento de red no duplica pedidos.                                                                                                             |
| **Códigos aleatorios Crockford** (`EZ-XXXX-XXXX`)                    | Son 40 bits de entropía, no secuenciales y sin caracteres ambiguos; la consulta pública exige además un verificador y está limitada por IP.                         |
| **Pagos manuales verificados**                                       | No se simulan pagos. La interfaz (`PaymentMethod.GATEWAY`) está preparada para una pasarela.                                                                        |
| **Couriers manuales**                                                | No se inventan tarifas; zonas y costos los configura ELZIIUS. Las plantillas de URL de rastreo permiten integrar APIs en el futuro.                                 |

## Módulos

| Ruta                             | Descripción                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/app/(public)`               | Sitio público: home, servicios, tienda, carrito, checkout, seguimiento, protocolos, legales |
| `src/app/(auth)`                 | Login y registro                                                                            |
| `src/app/(account)/mi-cuenta`    | Área del cliente (solo sus propios pedidos y equipos)                                       |
| `src/app/admin`                  | Panel: el layout valida rol de personal y cada página su permiso                            |
| `src/actions/public.ts`          | Solicitudes, seguimiento, carrito y pedido (rate limited)                                   |
| `src/actions/admin/*`            | Mutaciones del panel; todas pasan por `runAdminAction` (autoriza y valida)                  |
| `src/services/orders.ts`         | Pedidos, transiciones, reservas, ventas y entregas                                          |
| `src/services/inventory.ts`      | `computeMovement` (función pura y probada) y `applyMovement` (transaccional)                |
| `src/services/service-orders.ts` | Máquina de estados técnica, guardas de negocio y seguimiento público                        |
| `src/services/analytics.ts`      | KPIs y series agregadas en zona horaria America/Lima                                        |
| `src/lib/pdf`                    | Orden de servicio en PDF con el logotipo oficial                                            |
| `src/lib/storage`                | Driver local o S3, claves UUID generadas en el servidor                                     |

## Máquinas de estado

**Orden de servicio**: `RECEIVED → IN_DIAGNOSIS → QUOTE_SENT → (PENDING_APPROVAL) → APPROVED → IN_REPAIR ⇄ IN_TESTING → READY_FOR_DELIVERY → DELIVERED` (y `CANCELLED`). Guardas:

- `APPROVED` / `IN_REPAIR` requieren que la aprobación más reciente sea **APPROVED**.
- `READY_FOR_DELIVERY` requiere un control de calidad aprobado, salvo que el cliente haya rechazado el presupuesto (se devuelve el equipo sin reparar).
- `QUOTE_SENT` requiere diagnóstico y presupuesto registrados.

**Pedido**: `PENDING_CONFIRMATION → CONFIRMED (reserva) → PREPARING → READY → COMPLETED (venta)`; `CANCELLED` libera las reservas.

**Entrega**: estados según modalidad (recojo o courier). Marcar `DELIVERED` completa el pedido en la misma transacción.

## Identidad visual

- El logotipo oficial está en `public/logo/` (JPG y SVG originales, sin modificar).
- Las variantes (`elziius-logo-transparente.svg`, `elziius-isotipo.svg`, `elziius-isotipo-fondo.svg`) conservan geometría y colores; solo quitan el fondo o recortan el isotipo.
- La paleta (`src/app/globals.css`) se deriva del logo: navy `#0B223F` y rayo `#0099FF → #00D2FF → #66F0FF`.
- La paleta de gráficos fue validada para daltonismo y contraste sobre la superficie oscura.
