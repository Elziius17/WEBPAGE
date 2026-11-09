"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, X, Search, User } from "lucide-react";
import { publicNav } from "@/config/site";
import { LogoHorizontal } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils/cn";

export function SiteHeader({ account }: { account: { name: string; isStaff: boolean } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const accountHref = account ? (account.isStaff ? "/admin" : "/mi-cuenta") : "/login";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-white/8 bg-ink-950/85 backdrop-blur-xl" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="ELZIIUS, ir al inicio" onClick={() => setOpen(false)}>
          <LogoHorizontal />
        </Link>

        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
          {publicNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
                {active && <span className="mt-0.5 block h-px bg-gradient-to-r from-brand-blue to-brand-cyan" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ButtonLink href="/seguimiento" variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Search /> Seguimiento
          </ButtonLink>
          <Link
            href={accountHref}
            className="grid size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-white/6 hover:text-fg"
            aria-label={account ? `Mi cuenta (${account.name})` : "Iniciar sesión"}
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/carrito"
            className="relative grid size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-white/6 hover:text-fg"
            aria-label={`Carrito, ${count} producto(s)`}
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-brand-cyan px-1 text-[11px] font-bold text-ink-950">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl text-fg lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Móvil" className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/8 bg-ink-950 px-4 pb-10 lg:hidden">
          <ul className="flex flex-col py-4">
            {[...publicNav, { href: "/seguimiento", label: "Seguimiento de equipo" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/6 py-4 text-lg font-medium text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={accountHref} onClick={() => setOpen(false)} className="w-full" variant="secondary">
            {account ? "Mi cuenta" : "Iniciar sesión"}
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
