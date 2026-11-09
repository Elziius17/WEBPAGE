# Seguridad y protección de datos

## Controles implementados

| Área                | Implementación                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transporte          | HTTPS en producción, cabecera HSTS (`next.config.ts`), `upgrade-insecure-requests`                                                                                                           |
| Cabeceras           | CSP restrictiva, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sin `X-Powered-By`                                                                             |
| Contraseñas         | Hash **scrypt** (Better Auth); mínimo 10 caracteres con letras y números; nunca en texto plano                                                                                               |
| Sesiones            | En base de datos, cookies `HttpOnly`/`Secure`/`SameSite`, expiración a 7 días; se invalidan al desactivar o cambiar el rol de un usuario                                                     |
| Autorización        | RBAC verificado en el servidor en cada página (`requireStaffPage`), Server Action (`runAdminAction` → `authorize`) y Route Handler. Ocultar la UI no es la única barrera.                    |
| Alcance por técnico | Un técnico solo ve y modifica órdenes asignadas (`serviceOrderScope`)                                                                                                                        |
| Cliente             | Solo ve registros vinculados a su ficha (`/mi-cuenta`)                                                                                                                                       |
| CSRF                | Server Actions de Next.js (verificación de origen) y Better Auth (validación de origen)                                                                                                      |
| Validación          | Zod en el servidor para toda entrada; los formularios del cliente solo mejoran la experiencia                                                                                                |
| Inyección SQL       | Prisma con consultas parametrizadas (`$queryRaw` con _template tags_)                                                                                                                        |
| XSS                 | React escapa por defecto; el JSON-LD se serializa escapando `<`; no se renderiza HTML del usuario                                                                                            |
| Rate limiting       | Persistente en PostgreSQL: login (5/min), registro, formularios (5/10 min), seguimiento (10/10 min), checkout y libro de reclamaciones                                                       |
| Enumeración         | El seguimiento exige código + verificador y responde siempre con un mensaje genérico                                                                                                         |
| Archivos            | Tipo real por _magic bytes_ (JPG/PNG/WEBP/PDF), máximo 5 MB, claves UUID generadas en el servidor; los adjuntos técnicos solo se sirven a personal autorizado y con `Cache-Control: private` |
| Datos sensibles     | No se almacenan contraseñas de equipos ni datos de tarjetas; notas internas y diagnóstico técnico nunca salen en el seguimiento público; las IP de los formularios se seudonimizan con hash  |
| Auditoría           | `AuditLog` registra usuario, acción, entidad, antes/después, IP y _user agent_                                                                                                               |
| Secretos            | Solo variables de entorno; `.env` ignorado; `.env.example` sin valores reales; CI usa valores de relleno no secretos                                                                         |
| Open redirect       | El parámetro `next` del login solo acepta rutas internas                                                                                                                                     |
| Bots                | Campo trampa (_honeypot_) en formularios públicos                                                                                                                                            |

## Protección de datos personales (Ley N.º 29733)

- Consentimiento explícito en cada formulario, con enlace a la política de privacidad.
- Minimización: solo se piden los datos necesarios; el seguimiento muestra el primer nombre y datos del servicio.
- Política de privacidad base en `/legal/privacidad`, preparada para **revisión legal**. Falta completar los datos del titular y la inscripción del banco de datos ante la ANPD.
- Protocolo 06 de protección de datos en `/protocolos#proteccion-de-datos`.

## Recomendaciones operativas

1. Generar `BETTER_AUTH_SECRET` único por entorno y rotarlo ante incidentes.
2. Eliminar o desactivar los usuarios `[DEMO]` en producción (`SEED_DEMO_DATA=false`).
3. Usar un bucket S3/R2 **privado** para adjuntos; las imágenes de productos pueden ir en un bucket público.
4. Hacer respaldos automáticos diarios de PostgreSQL.
5. Revisar periódicamente **Admin › Auditoría**.
6. Ejecutar `npm audit` y mantener las dependencias actualizadas.

## Reporte de vulnerabilidades

Escribe al correo de seguridad configurado por ELZIIUS. No abras incidencias públicas con detalles explotables.
