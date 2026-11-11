"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/** Último recurso: el error ocurrió en el layout raíz. */
export default function RootError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="es-PE">
      <body style={{ fontFamily: "system-ui", background: "#050d1a", color: "#e6eef8" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ textAlign: "center" }}>
            <h1>Algo salió mal</h1>
            <p>Ocurrió un error inesperado. Recarga la página para intentarlo nuevamente.</p>
            {error.digest && (
              <p style={{ fontSize: 12, opacity: 0.6 }}>Referencia: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
