import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/observability/sentry-options";
import { initAnalytics } from "@/lib/observability/analytics";

try {
  if (baseSentryOptions.dsn) Sentry.init(baseSentryOptions);
} catch {
  // El monitoreo nunca debe romper la web.
}

try {
  initAnalytics();
} catch {
  // idem
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
