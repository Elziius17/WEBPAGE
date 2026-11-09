import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-white/8 surface px-2">
      {items.map((f) => (
        <details key={f.q} className="group px-4 py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-fg">
            {f.q}
            <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-fg-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
