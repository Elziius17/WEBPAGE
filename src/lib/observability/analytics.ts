import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
/** Rutas con datos personales o internos: nunca se analizan ni se graban. */
const PRIVATE_PATHS = /^\/(admin|mi-cuenta|login|registro|api)(\/|$)/;

export const CONSENT_KEY = "elziius-analytics-consent";
export type Consent = "granted" | "denied";

export const analyticsAvailable = () => Boolean(KEY) && process.env.NODE_ENV === "production";

let started = false;

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Inicializa PostHog SOLO si el visitante aceptó las cookies de analítica.
 * Los eventos pasan por /ingest (mismo dominio) y se omiten las rutas privadas.
 */
export function initAnalytics() {
  if (started || typeof window === "undefined" || !analyticsAvailable()) return;
  if (readConsent() !== "granted") return;
  started = true;
  posthog.init(KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: "history_change",
    capture_pageleave: true,
    person_profiles: "identified_only",
    autocapture: true,
    mask_all_text: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-private]",
    },
    before_send: (event) => {
      const url = event?.properties?.$current_url as string | undefined;
      if (url) {
        try {
          if (PRIVATE_PATHS.test(new URL(url).pathname)) return null;
        } catch {
          /* url inválida: se envía */
        }
      }
      return event;
    },
  });
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* almacenamiento bloqueado */
  }
  if (value === "granted") {
    initAnalytics();
    if (started) posthog.opt_in_capturing();
  } else if (started) {
    posthog.opt_out_capturing();
    posthog.reset();
  }
}
