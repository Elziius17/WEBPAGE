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
