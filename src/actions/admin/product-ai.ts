"use server";

import { BusinessError, handleActionError, type ActionResult } from "@/lib/actions";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { validateUpload } from "@/lib/security/file-validation";
import { buildKey, putObject } from "@/lib/storage";
import { AiUnavailableError, isProductAiEnabled } from "@/lib/ai/client";
import {
  extractProductDraft,
  type ProductDraft,
  type VisionImage,
} from "@/services/product-vision";

export type AnalyzeResult = { draft: ProductDraft; imageKeys: string[] };

const MAX_PHOTOS = 4;

/**
 * Lee las fotos de un producto con IA y devuelve un borrador de ficha.
 * Las fotos se guardan en el almacenamiento privado y se asocian al producto
 * solo cuando el personal revisa y guarda la ficha.
 */
export async function analyzeProductPhotosAction(
  fd: FormData,
): Promise<ActionResult<AnalyzeResult>> {
  try {
    const user = await authorize("products:write");
    if (!isProductAiEnabled())
      throw new BusinessError("El registro con foto está desactivado. Usa el registro manual.");
    const rl = await rateLimit("product-ai", user.id, { limit: 20, windowSeconds: 3600 });
    if (!rl.ok)
      throw new BusinessError(
        "Alcanzaste el límite de lecturas con IA por hora. Inténtalo más tarde.",
      );

    const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new BusinessError("Agrega al menos una foto del producto.");
    if (files.length > MAX_PHOTOS) throw new BusinessError(`Máximo ${MAX_PHOTOS} fotos.`);

    const images: (VisionImage & { ext: string })[] = [];
    for (const file of files) {
      // Las fotos llegan reducidas desde el navegador; 3.5 MB mantiene el base64 bajo el límite del modelo.
      const check = await validateUpload(file, { maxBytes: 3.5 * 1024 * 1024 });
      if (!check.ok) throw new BusinessError(`${file.name}: ${check.error}`);
      images.push({
        data: check.bytes,
        mediaType: check.mime as VisionImage["mediaType"],
        ext: check.ext,
      });
    }

    const categories = await db.category.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    });

    const { draft, usage } = await extractProductDraft(images, categories);

    const imageKeys: string[] = [];
    for (const img of images) {
      const key = buildKey("products", img.ext);
      await putObject(key, img.data, img.mediaType);
      imageKeys.push(key);
    }

    await audit({
      userId: user.id,
      action: "product.ai-extract",
      entity: "Product",
      after: {
        recognized: draft.recognized,
        brand: draft.brand,
        model: draft.model,
        photos: images.length,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      },
    });

    if (!draft.recognized) {
      return {
        ok: false,
        error:
          draft.notes ||
          "No se reconoció un producto informático en las fotos. Usa el registro manual.",
      };
    }
    return { ok: true, data: { draft, imageKeys } };
  } catch (e) {
    if (e instanceof AiUnavailableError) return { ok: false, error: e.message };
    return handleActionError(e);
  }
}
