import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-[80vh] place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-20 opacity-80" title="" />
        <p className="font-display text-gradient mt-6 text-6xl font-extrabold">404</p>
        <h1 className="text-fg mt-2 text-2xl font-bold">Página no encontrada</h1>
        <p className="text-fg-muted mt-2">El contenido que buscas no existe o fue movido.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="from-brand-blue to-brand-cyan text-ink-950 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold"
          >
            Ir al inicio
          </Link>
          <Link
            href="/tienda"
            className="text-fg rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold"
          >
            Ver la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
