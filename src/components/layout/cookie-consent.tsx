"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyticsAvailable,
  readConsent,
  setConsent,
  type Consent,
} from "@/lib/observability/analytics";

const OPEN_EVENT = "elziius:cookie-preferences";

/** Abre de nuevo el aviso (enlace "Preferencias de cookies" del pie de página). */
export function CookiePreferencesLink({ className }: { className?: string }) {
  if (!analyticsAvailable()) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      Preferencias de cookies
    </button>
  );
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsAvailable()) return;
    // Se decide en el cliente: el servidor no conoce la elección guardada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;
  const choose = (v: Consent) => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Uso de cookies de analítica"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
    >
      <div className="bg-ink-900 rounded-2xl border border-white/12 p-5 shadow-2xl shadow-black/60">
        <p className="text-fg flex items-center gap-2 font-semibold">
          <Cookie className="text-brand-cyan size-5" aria-hidden /> Tu privacidad
        </p>
        <p className="text-fg-muted mt-2 text-sm leading-relaxed">
          Usamos cookies de analítica para entender cómo se usa la web y mejorarla (páginas
          visitadas y grabaciones anónimas de navegación, con los formularios ocultos). Nunca en tu
          cuenta ni en el panel. Puedes cambiar tu elección cuando quieras.{" "}
          <Link href="/legal/privacidad#cookies" className="text-brand-cyan hover:underline">
            Más información
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => choose("granted")}>
            Aceptar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => choose("denied")}>
            Solo necesarias
          </Button>
        </div>
      </div>
    </div>
  );
}
