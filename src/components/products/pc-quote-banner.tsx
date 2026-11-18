import { ArrowRight, Cpu } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** Llamado a "Cotizar PC completa" para la tienda y la página de inicio. */
export function PcQuoteBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-brand-cyan/25 from-brand-blue/15 to-brand-cyan/10 flex flex-col gap-4 rounded-2xl border bg-gradient-to-r p-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span className="bg-brand-cyan/15 text-brand-cyan grid size-11 shrink-0 place-items-center rounded-xl">
          <Cpu className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-fg font-semibold">¿Buscas una PC completa?</p>
          <p className="text-fg-muted text-sm">
            Cuéntanos para qué la usarás y tu presupuesto: te la cotizamos armada, probada y con
            garantía.
          </p>
        </div>
      </div>
      <ButtonLink href="/cotizar-pc" className="shrink-0">
        Cotizar PC <ArrowRight />
      </ButtonLink>
    </div>
  );
}
