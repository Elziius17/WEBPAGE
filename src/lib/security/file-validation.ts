export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export type AllowedMime = keyof typeof ALLOWED_TYPES;

/** Detecta el tipo real por "magic bytes" (no se confía en la extensión ni en el MIME declarado). */
export function sniffMime(bytes: Uint8Array): AllowedMime | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp";
  if (
    b.length >= 5 &&
    b[0] === 0x25 &&
    b[1] === 0x50 &&
    b[2] === 0x44 &&
    b[3] === 0x46 &&
    b[4] === 0x2d
  )
    return "application/pdf";
  return null;
}

export type FileCheck =
  { ok: true; mime: AllowedMime; ext: string; bytes: Uint8Array } | { ok: false; error: string };

export async function validateUpload(
  file: File,
  { allowPdf = false, maxBytes = MAX_UPLOAD_BYTES }: { allowPdf?: boolean; maxBytes?: number } = {},
): Promise<FileCheck> {
  if (file.size === 0) return { ok: false, error: "El archivo está vacío." };
  if (file.size > maxBytes)
    return {
      ok: false,
      error: `El archivo supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." };
  if (mime === "application/pdf" && !allowPdf)
    return { ok: false, error: "Solo se permiten imágenes (JPG, PNG o WEBP)." };
  return { ok: true, mime, ext: ALLOWED_TYPES[mime], bytes };
}
