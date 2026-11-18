import { LogoMark } from "@/components/brand/logo";
import { LoadingSignal } from "@/components/layout/loading-signal";

/**
 * Carga de sección con el isotipo oficial al centro y dos anillos en relieve:
 * el exterior barre como un ventilador/disco girando y el interior gira en sentido
 * contrario. Aparece tras un breve retardo para no parpadear en cargas rápidas.
 */
export function BrandLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="brand-loader grid min-h-[70vh] place-items-center px-4">
      <LoadingSignal />
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-36 sm:size-40" aria-hidden>
          {/* Halo */}
          <div className="bg-brand-cyan/15 absolute -inset-6 rounded-full blur-2xl" />
          {/* Anillo exterior: barrido de luz */}
          <div className="loader-sweep absolute inset-0 rounded-full" />
          {/* Anillo medio: segmentos que giran en sentido contrario */}
          <div className="loader-segments border-brand-cyan/35 absolute inset-3 rounded-full border-2 border-dashed" />
          {/* Disco en relieve con el isotipo */}
          <div className="loader-disc absolute inset-6 grid place-items-center rounded-full">
            <LogoMark className="loader-logo size-14 sm:size-16" title="" />
          </div>
        </div>
        <p role="status" aria-live="polite" className="text-fg-muted text-sm tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
}
