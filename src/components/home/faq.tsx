import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="surface mx-auto max-w-3xl divide-y divide-white/8 px-2">
      {items.map((f) => (
        <details key={f.q} className="group px-4 py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="text-fg flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium">
            {f.q}
            <ChevronDown
              className="text-fg-subtle size-4 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="text-fg-muted pb-5 text-sm leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
