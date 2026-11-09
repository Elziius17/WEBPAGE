import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DynamicIcon } from "@/components/ui/icon";

export function ServiceCard({ service }: { service: { slug: string; code: string; name: string; shortDescription: string; icon: string } }) {
  return (
    <Link href={`/servicios/${service.slug}`} className="surface surface-hover group flex flex-col p-6">
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20">
          <DynamicIcon name={service.icon} className="size-6" />
        </span>
        <span className="font-display text-sm font-bold text-fg-subtle">{service.code}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-fg">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{service.shortDescription}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan">
        Ver detalle <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
