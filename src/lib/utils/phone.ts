/** Normaliza un teléfono peruano a solo dígitos con prefijo 51 cuando aplica. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) return `51${digits}`;
  return digits;
}

/** Compara dos teléfonos ignorando formato y prefijo de país (últimos 9 dígitos). */
export function phonesMatch(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  if (da.length < 7 || db.length < 7) return false;
  if (da.length >= 9 && db.length >= 9) return da.slice(-9) === db.slice(-9);
  return da === db;
}
