"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Wrench, Inbox, ListChecks, ShoppingBag, Truck, Package, Boxes, Users, Shield, Settings, ScrollText, Menu, X, ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { LogoHorizontal } from "@/components/brand/logo";
import type { AdminNavItem } from "@/config/admin-nav";
import { cn } from "@/lib/utils/cn";

const icons: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard, wrench: Wrench, inbox: Inbox, "list-checks": ListChecks, "shopping-bag": ShoppingBag,
  truck: Truck, package: Package, boxes: Boxes, users: Users, shield: Shield, settings: Settings, "scroll-text": ScrollText,
};

export function AdminSidebar({ nav, footer }: { nav: { group: string; items: AdminNavItem[] }[]; footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin/dashboard" onClick={() => setOpen(false)}><LogoHorizontal /></Link>
        <button className="grid size-9 place-items-center rounded-lg lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="size-5" /></button>
      </div>
      <nav aria-label="Panel" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = icons[it.icon] ?? Package;
                const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-brand-cyan/10 font-medium text-brand-cyan" : "text-fg-muted hover:bg-white/5 hover:text-fg",
                      )}
                    >
                      <Icon className="size-4" aria-hidden /> {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-subtle hover:text-fg"><ExternalLink className="size-4" aria-hidden /> Ver sitio público</Link>
      </nav>
      <div className="border-t border-white/8 p-4">{footer}</div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/8 bg-ink-950/90 px-4 backdrop-blur lg:hidden">
        <button className="grid size-9 place-items-center rounded-lg" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}><Menu className="size-5" /></button>
        <LogoHorizontal />
      </div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/8 bg-ink-950 lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/8 bg-ink-950">{content}</aside>
        </div>
      )}
    </>
  );
}
