import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: { href?: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative -mt-16 overflow-hidden border-b border-white/6 pt-16">
      <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="absolute -top-40 left-1/3 h-80 w-[700px] rounded-full bg-brand-blue/15 blur-[100px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:px-8">
        {breadcrumbs && (
          <nav aria-label="Ruta de navegación" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-fg-subtle">
              <li><Link href="/" className="hover:text-fg">Inicio</Link></li>
              {breadcrumbs.map((b) => (
                <li key={b.label} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden />
                  {b.href ? <Link href={b.href} className="hover:text-fg">{b.label}</Link> : <span aria-current="page" className="text-fg-muted">{b.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-brand-cyan uppercase">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-extrabold text-fg sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
