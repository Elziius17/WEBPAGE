"use client";
import { useEffect } from "react";

export const LOADING_EVENT = "elziius:route-loading";

declare global {
  interface Window {
    __elziiusLoading?: number;
  }
}

/**
 * Se monta dentro de los esqueletos de carga: avisa a la barra de progreso que la
 * sección aún está cargando, y que terminó cuando el esqueleto se desmonta.
 */
export function LoadingSignal() {
  useEffect(() => {
    window.__elziiusLoading = (window.__elziiusLoading ?? 0) + 1;
    window.dispatchEvent(new Event(LOADING_EVENT));
    return () => {
      window.__elziiusLoading = Math.max(0, (window.__elziiusLoading ?? 1) - 1);
      window.dispatchEvent(new Event(LOADING_EVENT));
    };
  }, []);
  return null;
}
