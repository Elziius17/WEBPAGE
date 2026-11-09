import { ArrowRight, Search, ShoppingBag, Wrench } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const quick = [
  {
    href: "/servicios",
    icon: Wrench,
    title: "Servicio técnico",
    text: "Mantenimiento, reparación y repotenciación",
  },
  {
    href: "/tienda",
    icon: ShoppingBag,
    title: "Tienda",
    text: "Componentes, periféricos e impresoras",
  },
  {
    href: "/seguimiento",
    icon: Search,
    title: "Seguimiento",
    text: "Consulta el estado de tu equipo",
  },
];

export function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div
        className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        aria-hidden
      />
      <div
        className="bg-brand-blue/20 absolute top-[-20%] left-1/2 h-[640px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <p className="border-brand-cyan/25 bg-brand-cyan/8 text-brand-cyan mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            <span className="bg-brand-cyan size-1.5 rounded-full" aria-hidden />{" "}
            {siteConfig.tagline}
          </p>
          <h1 className="text-fg text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl">
            La tecnología que necesitas,{" "}
            <span className="text-gradient">las soluciones que mereces.</span>
          </h1>
          <p className="text-fg-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/servicios" size="lg">
              Solicitar servicio <ArrowRight />
            </ButtonLink>
            <ButtonLink href="/tienda" size="lg" variant="secondary">
              Ver la tienda
            </ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block" aria-hidden>
          <div className="border-brand-cyan/15 absolute inset-6 rounded-full border" />
          <div className="border-brand-cyan/10 absolute inset-16 rounded-full border" />
          <div className="animate-pulse-glow bg-brand-cyan/15 absolute inset-20 rounded-full blur-3xl" />
          <LogoMark
            className="absolute inset-0 m-auto size-[62%] drop-shadow-[0_0_40px_rgb(0_210_255/0.35)]"
            title=""
          />
        </div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {quick.map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="surface surface-hover group flex min-w-0 items-center gap-4 p-5"
            >
              <span className="bg-brand-cyan/10 text-brand-cyan grid size-11 shrink-0 place-items-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="text-fg block font-semibold">{title}</span>
                <span className="text-fg-muted block truncate text-sm">{text}</span>
              </span>
              <ArrowRight
                className="text-fg-subtle group-hover:text-brand-cyan ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
