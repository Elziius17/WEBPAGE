"use client";
import { useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { analyzeProductPhotosAction, type AnalyzeResult } from "@/actions/admin/product-ai";
import { ProductForm, type ProductFormDraft } from "./product-form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const MAX_PHOTOS = 4;
const MAX_SIDE = 1600;

/** Reduce la foto en el navegador (máx. 1600 px, JPEG) para enviar menos datos. */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob
    ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })
    : file;
}

type Photo = { file: File; url: string };

export function PhotoProductWizard({
  categories,
  suppliers,
}: {
  categories: { id: string; name: string; slug: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(list).slice(0, room);
    const prepared = await Promise.all(picked.map(downscale));
    setPhotos((p) => [...p, ...prepared.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (i: number) =>
    setPhotos((p) => {
      URL.revokeObjectURL(p[i]!.url);
      return p.filter((_, j) => j !== i);
    });

  const analyze = () =>
    start(async () => {
      setError(null);
      const fd = new FormData();
      photos.forEach((p) => fd.append("photos", p.file));
      const res = await analyzeProductPhotosAction(fd);
      if (res.ok && res.data) setResult(res.data);
      else if (!res.ok) setError(res.error);
    });

  if (result) {
    const d = result.draft;
    const draft: ProductFormDraft = {
      name: d.name,
      brand: d.brand,
      model: d.model,
      categoryId: categories.find((c) => c.slug === d.categorySlug)?.id,
      condition: d.condition === "UNKNOWN" ? undefined : d.condition,
      shortDescription: d.shortDescription,
      description: d.description,
      specs: d.specs.map((s) => ({ label: s.label, value: s.value })),
      warrantyMonths: d.warrantyMonths ?? undefined,
    };
    const uncertain = [...d.uncertainFields];
    if (d.condition === "UNKNOWN") uncertain.push("condition");
    if (!draft.categoryId) uncertain.push("category");
    const inferred = d.specs.filter((s) => s.source === "inferido").length;
    return (
      <div className="space-y-6">
        <Alert tone="info" title="Ficha generada con IA: revísala antes de guardar">
          Completa el <strong>precio</strong> y el <strong>stock inicial</strong>. Los campos
          marcados con ⚠ deben verificarse.
          {inferred > 0 &&
            ` ${inferred} especificación(es) fueron deducidas del modelo, no leídas en la foto.`}
          {d.notes && <span className="mt-1 block">Nota de la IA: {d.notes}</span>}
        </Alert>
        <div className="flex flex-wrap items-center gap-3">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.url}
              src={p.url}
              alt=""
              className="size-20 rounded-lg border border-white/10 object-cover"
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setResult(null);
              setPhotos([]);
            }}
          >
            <RotateCcw /> Empezar de nuevo
          </Button>
        </div>
        <ProductForm
          categories={categories}
          suppliers={suppliers}
          draft={draft}
          uncertain={uncertain}
          pendingImageKeys={result.imageKeys}
        />
      </div>
    );
  }

  return (
    <div className="surface space-y-5 p-6">
      <div>
        <h2 className="text-fg flex items-center gap-2 font-semibold">
          <Sparkles className="text-brand-cyan size-5" aria-hidden /> Registrar con foto
        </h2>
        <p className="text-fg-muted mt-1 text-sm">
          Sube hasta {MAX_PHOTOS} fotos: el equipo, su{" "}
          <strong>etiqueta o placa con el modelo</strong> y la caja si la tienes. La IA completará
          la ficha; tú solo agregas precio y stock.
        </p>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.url} className="relative overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={`Foto ${i + 1}`}
              className="bg-ink-900 aspect-square w-full object-contain"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={`Quitar foto ${i + 1}`}
              className="bg-ink-950/80 text-fg absolute top-1.5 right-1.5 grid size-7 cursor-pointer place-items-center rounded-md"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="text-fg-muted hover:border-brand-cyan/50 hover:text-fg flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-center text-xs transition-colors">
            <ImagePlus className="size-6" aria-hidden />
            Agregar foto
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              capture="environment"
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={analyze} disabled={!photos.length || pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Camera />}
          {pending ? "Leyendo las fotos… (10 a 40 s)" : "Analizar con IA"}
        </Button>
        <p className="text-fg-subtle text-xs">
          Usa los créditos gratuitos de IA de Vercel. Si se agotan, usa el registro manual.
        </p>
      </div>
    </div>
  );
}
