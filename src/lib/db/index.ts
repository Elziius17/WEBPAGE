import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Permite compilar sin base de datos; cualquier consulta fallará con error de conexión.
    if (process.env.NEXT_PHASE !== "phase-production-build")
      console.error("[db] DATABASE_URL no está configurada");
    connectionString = "postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured";
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  // Un único cliente por proceso (evita múltiples pools con HMR y entre módulos).
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Cliente Prisma con inicialización perezosa: se conecta en la primera consulta,
 * lo que permite compilar (`next build`) sin base de datos disponible.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
