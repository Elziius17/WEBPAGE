import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function AdminPageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-fg">
            <ChevronLeft className="size-3.5" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface p-5 sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "accent", href }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: "accent" | "warning" | "success" | "danger" | "info"; href?: string }) {
  const tones = { accent: "text-brand-cyan bg-brand-cyan/10", warning: "text-warning bg-warning/10", success: "text-success bg-success/10", danger: "text-danger bg-danger/10", info: "text-info bg-info/10" };
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}><Icon className="size-4" aria-hidden /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-fg">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className="surface surface-hover block p-5">{body}</Link> : <div className="surface p-5">{body}</div>;
}

export function DataTable({ head, children, empty, minWidth = 720 }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode; minWidth?: number }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-white/8 text-left text-xs font-medium text-fg-subtle">
            {head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-white/5 [&>tr:last-child]:border-0 [&>tr:hover]:bg-white/2 [&_td]:px-4 [&_td]:py-3">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function TableEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-fg-subtle">{children}</p>;
}

export function Pagination({ page, pages, buildHref }: { page: number; pages: number; buildHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-fg-subtle">Página {page} de {pages}</span>
      {page > 1 && <Link href={buildHref(page - 1)} className="grid size-8 place-items-center rounded-lg border border-white/10 hover:border-brand-cyan/40" aria-label="Anterior"><ChevronLeft className="size-4" /></Link>}
      {page < pages && <Link href={buildHref(page + 1)} className="grid size-8 place-items-center rounded-lg border border-white/10 hover:border-brand-cyan/40" aria-label="Siguiente"><ChevronRight className="size-4" /></Link>}
    </nav>
  );
}

export function KeyValue({ items, cols = 2 }: { items: [ReactNode, ReactNode][]; cols?: 1 | 2 | 3 }) {
  const c = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[cols];
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-sm", c)}>
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt className="text-xs text-fg-subtle">{k}</dt>
          <dd className="mt-0.5 break-words text-fg">{v || <span className="text-fg-subtle">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} method="get" className="mb-5 flex flex-wrap items-end gap-3">
      {children}
    </form>
  );
}

/** Lee un searchParam como string acotado. */
export function sp(v: string | string[] | undefined, max = 100) {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, max) || undefined;
}
