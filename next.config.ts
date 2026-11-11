import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const isProd = process.env.NODE_ENV === "production";

/**
 * Política de seguridad de contenido. Se permite 'unsafe-inline' en estilos
 * por Tailwind/Next y en scripts por la hidratación de Next sin nonce.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me https://api.whatsapp.com",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "pg"],
  // El PDF de órdenes lee el logotipo oficial desde el disco del servidor.
  outputFileTracingIncludes: {
    "/api/admin/service-orders/**": ["./public/logo/elziius-logo-original.jpg"],
  },
  images: {
    remotePatterns: process.env.STORAGE_PUBLIC_URL
      ? [{ protocol: "https", hostname: new URL(process.env.STORAGE_PUBLIC_URL).hostname }]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  // PostHog por el mismo dominio: respeta la CSP (connect-src 'self') y evita bloqueadores.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "elziius",
  project: "elziius-web",
  // Sin SENTRY_AUTH_TOKEN no se suben source maps (la web funciona igual).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Los errores del navegador llegan por el mismo dominio (CSP 'self' y sin bloqueadores).
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
