/**
 * Precios para dropshipping a partir de la referencia de mercado en Lima.
 * Todo en soles; el formulario los convierte a céntimos al guardar.
 */

/** Precio típico de mercado: punto medio del rango observado en tiendas peruanas. */
export function typicalMarketPrice(range: { min: number; max: number }): number {
  return (range.min + range.max) / 2;
}

/**
 * Precio sugerido: un poco por encima del precio típico de mercado, terminado en ,90
 * (p. ej. típico S/ 262 + 5 % = 275.10 → S/ 275.90). Siempre queda sobre el típico.
 */
export function suggestedSalePrice(range: { min: number; max: number }, markupPercent: number) {
  const target = typicalMarketPrice(range) * (1 + markupPercent / 100);
  return Math.ceil(target) - 0.1;
}

/** Costo máximo de proveedor para conservar el margen objetivo sobre el precio de venta. */
export function maxCostForMargin(salePrice: number, marginPercent: number): number {
  return Math.floor(salePrice * (1 - marginPercent / 100) * 100) / 100;
}

/** "45 días (1 mes y medio)", "1 mes", "12 meses"… */
export function formatWarranty(days: number): string {
  if (days <= 0) return "Consultar";
  if (days % 30 === 0) {
    const m = days / 30;
    return m === 1 ? "1 mes" : `${m} meses`;
  }
  if (days === 45) return "45 días (1 mes y medio)";
  return `${days} días`;
}
