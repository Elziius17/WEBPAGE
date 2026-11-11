# Registro de productos con foto (IA) — desactivado

La plataforma incluye una segunda forma de registrar productos: subir fotos del equipo
(etiqueta, placa o caja) y obtener la ficha con **Claude Opus 5.5** a través de
**Vercel AI Gateway**. El personal solo completa precio, stock y SKU.

**Estado actual: desactivado** (interruptor `ENABLE_PRODUCT_AI`, apagado por defecto).

## Por qué está desactivado

AI Gateway entrega US$5 de crédito gratuito cada 30 días, pero **exige registrar una
tarjeta en la cuenta de Vercel** para liberarlo (respuesta `403
customer_verification_required`). Se decidió no habilitarlo para no asumir costos.

## Cómo reactivarlo

1. En Vercel › **AI Gateway**, registra una tarjeta.
2. Recomendado: en **AI Gateway › API Keys** crea una clave con **límite de gasto mensual**
   (por ejemplo US$5) y guárdala como `AI_GATEWAY_API_KEY` (tipo Sensitive). Sin esa clave,
   la plataforma usa el token OIDC del proyecto, que no tiene tope propio.
3. Define `ENABLE_PRODUCT_AI=true` en _Environment Variables_ (Production y Preview).
4. Redespliega. Aparecerá la pestaña **"Registrar con foto (IA)"** en Productos › Nuevo.

## Piezas del código

| Archivo                                         | Función                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/lib/ai/client.ts`                          | Cliente de Anthropic apuntando a AI Gateway e interruptor `isProductAiEnabled()`        |
| `src/services/product-vision.ts`                | Lectura de fotos con salida estructurada (Zod)                                          |
| `src/actions/admin/product-ai.ts`               | Acción del servidor: permisos, límite de 20 lecturas/hora, guardado de fotos, auditoría |
| `src/components/admin/photo-product-wizard.tsx` | Interfaz: subida, reducción de fotos en el navegador y revisión de la ficha             |
