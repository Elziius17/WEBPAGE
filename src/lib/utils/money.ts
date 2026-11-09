const formatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Formatea céntimos de PEN como "S/ 1,234.50". */
export function formatPEN(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return formatter.format(cents / 100);
}

/** Convierte un monto en soles (número o texto "1234.50") a céntimos enteros. */
export function solesToCents(value: number | string): number {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (!Number.isFinite(n)) throw new Error("Monto inválido");
  return Math.round(n * 100);
}

export function centsToSoles(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

/** Margen comercial referencial en %, o null si no hay costo. */
export function marginPercent(priceCents: number, costCents: number | null | undefined) {
  if (!costCents || priceCents <= 0) return null;
  return Math.round(((priceCents - costCents) / priceCents) * 1000) / 10;
}
