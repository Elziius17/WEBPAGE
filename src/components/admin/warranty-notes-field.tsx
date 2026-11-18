"use client";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/form";
import { warrantyNoteFor } from "@/config/warranty-notes";

/**
 * Notas de garantía que se autocompletan según la categoría y los días de garantía
 * elegidos en el formulario. Si la persona edita el texto, deja de reemplazarse.
 */
export function WarrantyNotesField({
  initial,
  auto,
  categorySlugs,
}: {
  initial: string;
  /** true al crear un producto: rellena y actualiza automáticamente. */
  auto: boolean;
  categorySlugs: Record<string, string>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(!auto);

  useEffect(() => {
    if (touched) return;
    const form = ref.current?.form;
    if (!form) return;
    const compute = () => {
      const cat = (form.elements.namedItem("categoryId") as HTMLSelectElement | null)?.value;
      const days = Number(
        (form.elements.namedItem("warrantyDays") as HTMLInputElement | null)?.value ?? 0,
      );
      setValue(warrantyNoteFor(cat ? categorySlugs[cat] : undefined, days));
    };
    compute();
    form.addEventListener("input", compute);
    form.addEventListener("change", compute);
    return () => {
      form.removeEventListener("input", compute);
      form.removeEventListener("change", compute);
    };
  }, [touched, categorySlugs]);

  return (
    <Textarea
      ref={ref}
      id="warrantyNotes"
      name="warrantyNotes"
      rows={2}
      maxLength={500}
      value={value}
      onChange={(e) => {
        setTouched(true);
        setValue(e.target.value);
      }}
    />
  );
}
