import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DynamicIcon } from "@/components/ui/icon";

export function ServiceCard({
  service,
}: {
  service: { slug: string; code: string; name: string; shortDescription: string; icon: string };
}) {
  return (
    <Link
      href={`/servicios/${service.slug}`}
      className="surface surface-hover group flex flex-col p-6"
    >
      <div className="flex items-start justify-between">
        <span className="from-brand-blue/20 to-brand-cyan/10 text-brand-cyan ring-brand-cyan/20 grid size-12 place-items-center rounded-2xl bg-gradient-to-br ring-1">
          <DynamicIcon name={service.icon} className="size-6" />
        </span>
        <span className="font-display text-fg-subtle text-sm font-bold">{service.code}</span>
      </div>
      <h3 className="text-fg mt-5 text-lg font-semibold">{service.name}</h3>
      <p className="text-fg-muted mt-2 flex-1 text-sm leading-relaxed">
        {service.shortDescription}
      </p>
      <span className="text-brand-cyan mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
        Ver detalle{" "}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
