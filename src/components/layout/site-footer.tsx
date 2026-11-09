import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { legalNav, publicNav, siteConfig } from "@/config/site";
import type { PublicBusinessInfo } from "@/services/settings";

export function SiteFooter({ business }: { business: PublicBusinessInfo }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/8 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <LogoFull className="h-32 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
            Soporte técnico especializado, venta de componentes y desarrollo web para particulares y empresas.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-fg">Navegación</h2>
          <ul className="space-y-2.5 text-sm">
            {publicNav.map((n) => (
              <li key={n.href}>
                <Link className="text-fg-muted transition-colors hover:text-brand-cyan" href={n.href}>{n.label}</Link>
              </li>
            ))}
            <li><Link className="text-fg-muted transition-colors hover:text-brand-cyan" href="/seguimiento">Seguimiento de equipo</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-fg">Políticas</h2>
          <ul className="space-y-2.5 text-sm">
            {legalNav.map((n) => (
              <li key={n.href}>
                <Link className="text-fg-muted transition-colors hover:text-brand-cyan" href={n.href}>{n.label}</Link>
              </li>
            ))}
            <li><Link className="text-fg-muted transition-colors hover:text-brand-cyan" href="/libro-de-reclamaciones">Libro de reclamaciones</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-fg">Contacto</h2>
          <ul className="space-y-3 text-sm text-fg-muted">
            {business.phone && (
              <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 text-brand-cyan" aria-hidden /><a href={`tel:${business.phone.replace(/\s/g, "")}`} className="hover:text-fg">{business.phone}</a></li>
            )}
            {business.email && (
              <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 text-brand-cyan" aria-hidden /><a href={`mailto:${business.email}`} className="hover:text-fg">{business.email}</a></li>
            )}
            {(business.address || business.city) && (
              <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 text-brand-cyan" aria-hidden />{[business.address, business.city].filter(Boolean).join(", ")}</li>
            )}
            {business.schedule && (
              <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 text-brand-cyan" aria-hidden /><span className="whitespace-pre-line">{business.schedule}</span></li>
            )}
            {!business.phone && !business.email && !business.address && (
              <li><Link href="/contacto" className="text-brand-cyan hover:underline">Escríbenos desde el formulario de contacto</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} {siteConfig.name}. Todos los derechos reservados.</p>
          <p>Precios en soles (PEN) · Perú</p>
        </div>
      </div>
    </footer>
  );
}
