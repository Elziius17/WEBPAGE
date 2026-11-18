import { cn } from "@/lib/utils/cn";
import { LoadingSignal } from "@/components/layout/loading-signal";

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Texto accesible mientras carga (los bloques son decorativos). */
function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <>
      <LoadingSignal />
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>
    </>
  );
}

/** Cabecera de página pública mientras carga (misma altura que PageHero). */
export function PageHeroSkeleton() {
  return (
    <section className="relative -mt-16 overflow-hidden border-b border-white/6 pt-16">
      <div
        className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl space-y-4 px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:px-8">
        <Bone className="h-3 w-40" />
        <Bone className="h-3 w-24" />
        <Bone className="h-10 w-full max-w-xl" />
        <Bone className="h-4 w-full max-w-2xl" />
        <Bone className="h-4 w-2/3 max-w-lg" />
      </div>
    </section>
  );
}

export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface space-y-3 p-6">
          <Bone className="size-11 rounded-xl" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface overflow-hidden">
          <Bone className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <Bone className="h-3 w-20" />
            <Bone className="h-4 w-full" />
            <Bone className="h-6 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Carga genérica de una página pública. */
export function PublicPageSkeleton() {
  return (
    <>
      <Loading />
      <PageHeroSkeleton />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CardGridSkeleton />
      </div>
    </>
  );
}

export function StorePageSkeleton() {
  return (
    <>
      <Loading label="Cargando productos…" />
      <PageHeroSkeleton />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex gap-2 overflow-hidden" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <Bone key={i} className="h-10 w-32 shrink-0" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="surface hidden h-96 space-y-4 p-5 lg:block" aria-hidden>
            <Bone className="h-4 w-24" />
            <Bone className="h-10 w-full" />
            <Bone className="h-4 w-20" />
            <Bone className="h-10 w-full" />
            <Bone className="h-4 w-28" />
            <Bone className="h-10 w-full" />
          </div>
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </>
  );
}

/** Carga de una página del panel: cabecera, tarjetas y tabla. */
export function AdminPageSkeleton() {
  return (
    <div aria-hidden={false}>
      <Loading />
      <div className="mb-8 space-y-3" aria-hidden>
        <Bone className="h-8 w-64" />
        <Bone className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface space-y-3 p-5">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="surface mt-6 space-y-3 p-5" aria-hidden>
        <Bone className="h-5 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
