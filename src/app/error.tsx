"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-fg">Algo salió mal</h1>
        <p className="mt-2 text-fg-muted">Ocurrió un error inesperado. Inténtalo nuevamente.</p>
        {error.digest && <p className="mt-1 text-xs text-fg-subtle">Referencia: {error.digest}</p>}
        <button onClick={reset} className="mt-6 cursor-pointer rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2.5 text-sm font-semibold text-ink-950">Reintentar</button>
      </div>
    </main>
  );
}
