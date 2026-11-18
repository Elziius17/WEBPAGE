/**
 * Notas de garantía sugeridas por categoría. "{garantia}" se reemplaza por la
 * garantía del producto (p. ej. "45 días"). Se autocompletan al crear un producto
 * y siempre se pueden editar.
 */
const PERIPHERALS =
  "Garantía de {garantia} con ELZIIUS por fallas de fábrica. No cubre golpes, cables dañados, humedad ni desgaste por uso. Presenta tu boleta y la caja original con sus accesorios.";

export const warrantyNoteTemplates: Record<string, string> = {
  audifonos: PERIPHERALS,
  mouse: PERIPHERALS,
  teclados: PERIPHERALS,
  "combos-3-en-1": PERIPHERALS,
  adaptadores:
    "Garantía de {garantia} con ELZIIUS por fallas de fábrica. No cubre conectores doblados, golpes ni daños físicos. Presenta tu boleta y el empaque original.",
  "tarjetas-graficas":
    "Garantía de {garantia} con ELZIIUS por fallas de fábrica. No cubre daños por fuente de poder insuficiente, overclock, minería ni manipulación. Requiere boleta, caja original y sellos intactos.",
  "ssd-nvme":
    "Garantía de {garantia} con ELZIIUS por fallas de fábrica. No incluye la recuperación de datos: respalda tu información. Requiere boleta y que el sello del producto esté intacto.",
  "memoria-ram":
    "Garantía de {garantia} con ELZIIUS por fallas de fábrica. Válida instalada en una placa compatible; no cubre daños por manipulación o descarga eléctrica. Requiere boleta y sello intacto.",
};

const DEFAULT_TEMPLATE =
  "Garantía de {garantia} con ELZIIUS por fallas de fábrica. No cubre daños por mal uso, golpes ni humedad. Presenta tu boleta y la caja original.";

/** Texto de garantía para una categoría y una garantía en días. Sin garantía → vacío. */
export function warrantyNoteFor(categorySlug: string | undefined, days: number): string {
  if (!days || days <= 0) return "";
  const label = days % 30 === 0 ? (days === 30 ? "1 mes" : `${days / 30} meses`) : `${days} días`;
  const template = (categorySlug && warrantyNoteTemplates[categorySlug]) || DEFAULT_TEMPLATE;
  return template.replace("{garantia}", label);
}
