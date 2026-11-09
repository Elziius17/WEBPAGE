import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: { DATABASE_URL: "postgresql://unit:unit@127.0.0.1:1/unit" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/services/**"],
      reporter: ["text", "html"],
    },
  },
});
