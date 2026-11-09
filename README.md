<p align="center">
  <img src="public/logo/elziius-logo-original.jpg" alt="ELZIIUS — Soporte · Hardware · Web" width="420" />
</p>

# ELZIIUS Platform

**La tecnología que necesitas, las soluciones que mereces.**

Plataforma web full stack de **ELZIIUS**: servicios IT, comercio de componentes tecnológicos y gestión de soporte técnico para particulares y empresas en Perú.

Tiene dos entornos:

- **Público**: presentación de la empresa, catálogo de servicios, tienda con carrito y pedidos, seguimiento en línea de equipos en reparación, protocolos corporativos, contacto por WhatsApp y Libro de Reclamaciones.
- **Administrativo**: dashboard con analítica, órdenes de servicio digitales (recepción → diagnóstico → presupuesto → aprobación → reparación → control de calidad → entrega, con PDF), inventario con trazabilidad, pedidos, entregas y courier, clientes, usuarios con roles, configuración y auditoría.

---

## Funcionalidades

| Módulo              | Qué incluye                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sitio público       | Home con 12 secciones, 7 servicios con página propia, desarrollo web, protocolos con líneas de tiempo, nosotros, contacto, 5 políticas legales, Libro de Reclamaciones, SEO (metadatos, Open Graph, sitemap, robots, JSON-LD)                                   |
| Tienda              | Búsqueda, filtros (categoría, marca, precio, stock, promoción), ordenamiento, paginación, ficha técnica, relacionados, carrito, checkout con **recojo presencial** o **courier**, confirmación por WhatsApp                                                     |
| Seguimiento         | `/seguimiento` con código no secuencial `EZ-XXXX-XXXX` + correo o teléfono; muestra solo información apta para el cliente                                                                                                                                       |
| Órdenes de servicio | Recepción con fotos, diagnóstico, presupuesto, **aprobación con evidencia**, actividades, repuestos (descuentan inventario), checklist de calidad configurable, cierre con garantía y conformidad, historial con usuario y fecha, **PDF con identidad ELZIIUS** |
| Inventario          | Entradas, salidas, ajustes con motivo, reservas/liberaciones/ventas automáticas, alertas de stock mínimo, proveedores, costo y margen referencial, valorización                                                                                                 |
| Pedidos y entregas  | Confirmación con verificación y reserva de stock, pagos **verificados manualmente** (sin simulaciones), estados de entrega, couriers, zonas, guía, peso/dimensiones, comprobantes, incidencias                                                                  |
| Administración      | Dashboard (KPIs y 6 gráficos), productos, servicios, clientes con historial, solicitudes, usuarios y roles, configuración del negocio, testimonios y auditoría                                                                                                  |
| Seguridad           | RBAC en servidor (ADMIN, TÉCNICO, VENTAS, CLIENTE), hash scrypt, sesiones en BD, rate limiting persistente, CSP/HSTS, validación Zod en servidor, validación de archivos por _magic bytes_, auditoría                                                           |

## Tecnologías

- **Next.js 16** (App Router, Server Actions, Route Handlers) · **React 19** · **TypeScript estricto**
- **Tailwind CSS v4** · **Lucide** · **Recharts** · **React Hook Form + Zod 4**
- **PostgreSQL 16** · **Prisma 7** (adaptador `pg`, migraciones versionadas, seed)
- **Better Auth** (email y contraseña, sesiones, rate limit)
- **@react-pdf/renderer** (órdenes en PDF) · **S3 compatible** (AWS S3, Cloudflare R2, MinIO) o disco local
- **Vitest** (unitarias e integración) · **Playwright** (E2E) · **ESLint** · **Prettier** · **GitHub Actions**

## Requisitos

- Node.js **20.9+** (recomendado 22 LTS)
- PostgreSQL **16** (local o con `docker compose`)
- npm 10+

## Instalación

```bash
git clone https://github.com/Elziius17/WEBPAGE.git
```

```bash
cd WEBPAGE
```

```bash
npm install
```

`npm install` ejecuta `prisma generate` automáticamente.

## Variables de entorno

```bash
cp .env.example .env
```

| Variable                                                 | Descripción                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                           | Cadena de conexión de PostgreSQL                                                                                                                       |
| `BETTER_AUTH_SECRET`                                     | Secreto de sesiones (`openssl rand -base64 32`)                                                                                                        |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL`               | URL pública del sitio                                                                                                                                  |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                            | Número comercial (p. ej. `51987654321`). **Opcional**: también se configura desde el panel. Sin número, los botones lo indican y no se inventa ninguno |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE` | Contacto (opcional, editable desde el panel)                                                                                                           |
| `STORAGE_DRIVER`                                         | `local` (desarrollo) o `s3`                                                                                                                            |
| `S3_*`, `STORAGE_PUBLIC_URL`                             | Credenciales del bucket si `STORAGE_DRIVER=s3`                                                                                                         |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`                | Administrador inicial que crea el seed                                                                                                                 |
| `SEED_DEMO_DATA`                                         | `true` para cargar datos de demostración marcados **[DEMO]**                                                                                           |

> Nunca subas el archivo `.env` real. Está ignorado en `.gitignore`.

## Base de datos

Con Docker (PostgreSQL + MinIO):

```bash
docker compose up -d
```

Aplicar migraciones (desarrollo):

```bash
npm run db:migrate
```

Aplicar migraciones (producción, no interactivo):

```bash
npm run db:deploy
```

Cargar datos iniciales (roles, permisos, administrador, servicios, categorías, checklist y datos `[DEMO]` opcionales):

```bash
npm run db:seed
```

Las migraciones incluyen restricciones `CHECK` que impiden, a nivel de base de datos, stock negativo, reservas mayores al stock y montos inválidos.

## Ejecución local

```bash
npm run dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/admin (usa `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- Con datos demo también existen `tecnico.demo@elziius.local` / `DemoTecnico#2026` y `ventas.demo@elziius.local` / `DemoVentas#2026`. **Elimínalos o desactívalos en producción.**

## Pruebas

Unitarias (reglas de inventario, máquina de estados, validaciones, RBAC, utilidades):

```bash
npm test
```

Integración contra PostgreSQL real (requiere una base cuyo nombre termine en `_test`; se vacía en cada ejecución):

```bash
DATABASE_URL_TEST="postgresql://elziius:elziius_dev@localhost:5432/elziius_test" npm run test:integration
```

E2E con Playwright (levanta el servidor si no está corriendo; requiere la base con seed):

```bash
npm run test:e2e -- --trace off
```

Calidad:

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run format:check
```

## Despliegue

Guía completa en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Resumen:

1. PostgreSQL gestionado (Neon, Supabase, RDS, Railway…).
2. Variables de entorno de producción (incluye un `BETTER_AUTH_SECRET` nuevo).
3. `npm ci && npm run db:deploy && npm run build && npm start` (o Vercel / Railway / Docker).
4. Almacenamiento S3/R2 para imágenes (el disco local no persiste en plataformas serverless).
5. Ejecutar `npm run db:seed` una vez con `SEED_DEMO_DATA=false`.

## Estructura

```
prisma/            schema, migraciones, seed y datos iniciales
src/app/(public)   sitio público          src/app/admin      panel administrativo
src/app/(auth)     login y registro       src/app/(account)  área del cliente
src/app/api        auth, archivos, PDF    src/actions        Server Actions (públicas y admin)
src/services       reglas de negocio      src/lib            db, auth, seguridad, storage, validaciones, utils
src/components     UI reutilizable        src/config         contenido, estados, navegación
tests/             unit · integration · e2e
docs/              arquitectura, base de datos, seguridad, API, guía de uso y despliegue
```

## Flujo de trabajo Git

- `main`: producción · `develop`: integración
- `feature/nombre-funcionalidad` · `fix/nombre-error`
- [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- CI (GitHub Actions): tipos, ESLint, Prettier, unitarias, build, integración con PostgreSQL y E2E.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Base de datos](docs/DATABASE.md)
- [Seguridad](docs/SECURITY.md)
- [API y Server Actions](docs/API.md)
- [Guía de usuario](docs/USER_GUIDE.md)
- [Despliegue](docs/DEPLOYMENT.md)

## Pendientes que requieren datos o credenciales externas

- Número de WhatsApp, correo, teléfono, dirección, RUC y horarios reales → **Admin › Configuración**.
- Revisión legal de las políticas (`src/config/legal.tsx`), que están preparadas como borradores; incluye el número de inscripción del banco de datos ante la ANPD.
- Pasarela de pago: el modelo `Payment` y el método `GATEWAY` están preparados; falta integrar el proveedor elegido.
- Integraciones con APIs de courier: hoy el seguimiento se gestiona manualmente con plantillas de URL de rastreo.
- Envío automático de correos y notificaciones (el modelo `Notification` existe; falta el proveedor SMTP).

---

© ELZIIUS. Todos los derechos reservados.
