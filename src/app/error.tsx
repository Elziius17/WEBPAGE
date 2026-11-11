"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-fg text-2xl font-bold">Algo salió mal</h1>
        <p className="text-fg-muted mt-2">Ocurrió un error inesperado. Inténtalo nuevamente.</p>
        {error.digest && <p className="text-fg-subtle mt-1 text-xs">Referencia: {error.digest}</p>}
        <button
          onClick={reset}
          className="from-brand-blue to-brand-cyan text-ink-950 mt-6 cursor-pointer rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
