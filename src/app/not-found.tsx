import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-[80vh] place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-20 opacity-80" title="" />
        <p className="mt-6 font-display text-6xl font-extrabold text-gradient">404</p>
        <h1 className="mt-2 text-2xl font-bold text-fg">Página no encontrada</h1>
        <p className="mt-2 text-fg-muted">El contenido que buscas no existe o fue movido.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2.5 text-sm font-semibold text-ink-950">Ir al inicio</Link>
          <Link href="/tienda" className="rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-fg">Ver la tienda</Link>
        </div>
      </div>
    </main>
  );
}
