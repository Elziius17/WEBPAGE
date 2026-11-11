import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { legalNav, publicNav, siteConfig } from "@/config/site";
import type { PublicBusinessInfo } from "@/services/settings";
import { CookiePreferencesLink } from "@/components/layout/cookie-consent";

export function SiteFooter({ business }: { business: PublicBusinessInfo }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink-950 mt-auto border-t border-white/8">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <LogoFull className="h-32 w-auto" />
          <p className="text-fg-muted mt-4 max-w-xs text-sm leading-relaxed">
            Soporte técnico especializado, venta de componentes y desarrollo web para particulares y
            empresas.
          </p>
        </div>
        <div>
          <h2 className="text-fg mb-4 text-sm font-semibold">Navegación</h2>
          <ul className="space-y-2.5 text-sm">
            {publicNav.map((n) => (
              <li key={n.href}>
                <Link
                  className="text-fg-muted hover:text-brand-cyan transition-colors"
                  href={n.href}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesLink className="text-fg-muted hover:text-brand-cyan cursor-pointer text-left transition-colors" />
            </li>
            <li>
              <Link
                className="text-fg-muted hover:text-brand-cyan transition-colors"
                href="/seguimiento"
              >
                Seguimiento de equipo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-fg mb-4 text-sm font-semibold">Políticas</h2>
          <ul className="space-y-2.5 text-sm">
            {legalNav.map((n) => (
              <li key={n.href}>
                <Link
                  className="text-fg-muted hover:text-brand-cyan transition-colors"
                  href={n.href}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="text-fg-muted hover:text-brand-cyan transition-colors"
                href="/libro-de-reclamaciones"
              >
                Libro de reclamaciones
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-fg mb-4 text-sm font-semibold">Contacto</h2>
          <ul className="text-fg-muted space-y-3 text-sm">
            {business.phone && (
              <li className="flex gap-2.5">
                <Phone className="text-brand-cyan mt-0.5 size-4" aria-hidden />
                <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="hover:text-fg">
                  {business.phone}
                </a>
              </li>
            )}
            {business.email && (
              <li className="flex gap-2.5">
                <Mail className="text-brand-cyan mt-0.5 size-4" aria-hidden />
                <a href={`mailto:${business.email}`} className="hover:text-fg">
                  {business.email}
                </a>
              </li>
            )}
            {(business.address || business.city) && (
              <li className="flex gap-2.5">
                <MapPin className="text-brand-cyan mt-0.5 size-4" aria-hidden />
                {[business.address, business.city].filter(Boolean).join(", ")}
              </li>
            )}
            {business.schedule && (
              <li className="flex gap-2.5">
                <Clock className="text-brand-cyan mt-0.5 size-4" aria-hidden />
                <span className="whitespace-pre-line">{business.schedule}</span>
              </li>
            )}
            {!business.phone && !business.email && !business.address && (
              <li>
                <Link href="/contacto" className="text-brand-cyan hover:underline">
                  Escríbenos desde el formulario de contacto
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/6">
        <div className="text-fg-subtle mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <p>Precios en soles (PEN) · Perú</p>
        </div>
      </div>
    </footer>
  );
}
