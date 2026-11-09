import { defineConfig } from "vitest/config";
import path from "node:path";

/** Pruebas de integración contra una base PostgreSQL real (DATABASE_URL_TEST). */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/integration/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        "postgresql://elziius:elziius_dev@localhost:5432/elziius_test?schema=public",
    },
  },
});
