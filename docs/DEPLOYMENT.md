# Guía de despliegue

## Requisitos de producción

- Node.js 22 LTS
- PostgreSQL 16 gestionado (Neon, Supabase, AWS RDS, Railway, etc.) con respaldos automáticos
- Almacenamiento S3 compatible (Cloudflare R2 recomendado) si la plataforma no tiene disco persistente
- Dominio con HTTPS

> **GitHub Pages no sirve para esta plataforma**: solo publica archivos estáticos y aquí hay servidor, base de datos y autenticación.

## Variables de entorno

| Variable                                                                            | Producción                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`                                                                      | Cadena de conexión con `sslmode=require`                |
| `BETTER_AUTH_SECRET`                                                                | Nuevo, 32+ bytes aleatorios (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`                                           | `https://tu-dominio.pe`                                 |
| `STORAGE_DRIVER`                                                                    | `s3`                                                    |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Credenciales del bucket                                 |
| `STORAGE_PUBLIC_URL`                                                                | URL pública para las imágenes de productos (opcional)   |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                                                       | Opcional (también se configura en el panel)             |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`                                           | Solo para el primer seed; luego elimínalas              |
| `SEED_DEMO_DATA`                                                                    | `false`                                                 |

## Opción A: Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno (usa `STORAGE_DRIVER=s3`, porque Vercel no tiene disco persistente).
3. _Build command_: `npm run db:deploy && npm run build`.
4. Despliega y ejecuta el seed una vez desde tu máquina, apuntando a la base de producción:

```bash
SEED_DEMO_DATA=false npm run db:seed
```

## Opción B: servidor propio, Railway o Render

```bash
npm ci
```

```bash
npm run db:deploy
```

```bash
npm run build
```

```bash
npm start
```

Usa un proxy inverso (Nginx o Caddy) con HTTPS. Con `STORAGE_DRIVER=local`, monta un volumen persistente en `STORAGE_LOCAL_DIR` y respáldalo.

## Ramas y CI/CD

- Los PR a `develop` y `main` ejecutan CI: tipos, ESLint, Prettier, unitarias, build, integración con PostgreSQL y E2E.
- `main` = producción. Conecta tu plataforma para desplegar automáticamente al hacer merge en `main`.
- Protege `main` en GitHub (Settings › Branches) exigiendo que CI pase y revisión de PR.

## Lista de verificación al publicar

- [ ] `SEED_DEMO_DATA=false` y productos o usuarios `[DEMO]` eliminados o desactivados
- [ ] Datos reales en Admin › Configuración (RUC, dirección, WhatsApp, horario)
- [ ] Políticas legales revisadas por un abogado y placeholders `[ ]` completados
- [ ] Bucket de adjuntos privado y respaldo diario de la base de datos
- [ ] Contraseña del administrador cambiada y variables del seed eliminadas
- [ ] Dominio con HTTPS y `NEXT_PUBLIC_SITE_URL` correcto (afecta al sitemap y Open Graph)
