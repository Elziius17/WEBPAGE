"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LOADING_EVENT } from "./loading-signal";

const START_EVENT = "elziius:route-start";

/**
 * Barra de progreso superior durante la navegación entre secciones.
 * Empieza al iniciar la transición y termina cuando la nueva ruta ya se muestra
 * y no queda ningún esqueleto de carga en pantalla.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const running = useRef(false);
  const arrived = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (!running.current) return;
    running.current = false;
    if (safety.current) clearTimeout(safety.current);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 320);
  }, []);

  const tryFinish = useCallback(() => {
    if (running.current && arrived.current && !(window.__elziiusLoading ?? 0)) finish();
  }, [finish]);

  useEffect(() => {
    const onStart = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      if (url) {
        try {
          const next = new URL(url, location.href);
          // Mismo destino (p. ej. un ancla): no hay carga que mostrar.
          if (next.pathname === location.pathname && next.search === location.search) return;
        } catch {
          /* URL no válida: se muestra igual */
        }
      }
      if (hide.current) clearTimeout(hide.current);
      if (timer.current) clearInterval(timer.current);
      running.current = true;
      arrived.current = false;
      setVisible(true);
      setProgress(12);
      // Avanza rápido al inicio y cada vez más lento, sin llegar al 100 % hasta terminar.
      // Nunca dejar la barra colgada (navegación cancelada o error).
      if (safety.current) clearTimeout(safety.current);
      safety.current = setTimeout(finish, 15000);
      timer.current = setInterval(() => {
        setProgress((p) => (p < 92 ? p + (92 - p) * 0.1 : p));
      }, 200);
    };
    const onLoading = () => tryFinish();
    window.addEventListener(START_EVENT, onStart);
    window.addEventListener(LOADING_EVENT, onLoading);
    return () => {
      window.removeEventListener(START_EVENT, onStart);
      window.removeEventListener(LOADING_EVENT, onLoading);
    };
  }, [tryFinish, finish]);

  useEffect(() => {
    if (!running.current) return;
    arrived.current = true;
    // Espera un instante por si la ruta nueva monta su esqueleto de carga.
    const t = setTimeout(tryFinish, 60);
    return () => clearTimeout(t);
  }, [pathname, search, tryFinish]);

  return (
    <div
      aria-hidden
      data-route-progress
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <div
        className="from-brand-blue to-brand-cyan h-full bg-gradient-to-r shadow-[0_0_10px_rgb(0_210_255/0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
