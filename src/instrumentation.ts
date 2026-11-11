import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/observability/sentry-options";

export async function register() {
  if (!baseSentryOptions.dsn) return;
  Sentry.init(baseSentryOptions);
}

export const onRequestError = Sentry.captureRequestError;
