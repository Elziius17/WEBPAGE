import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

import { siteConfig } from "@/config/site";

const baseURL = process.env.BETTER_AUTH_URL || siteConfig.url;

if (!process.env.BETTER_AUTH_SECRET && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error(
    "[auth] Falta la variable BETTER_AUTH_SECRET. Defínela en el entorno (Vercel: Settings › Environment Variables) y vuelve a desplegar.",
  );
}

export const auth = betterAuth({
  appName: "ELZIIUS",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // input: false => el cliente nunca puede asignarse un rol al registrarse.
      role: { type: "string", input: false, defaultValue: "CUSTOMER" },
      active: { type: "boolean", input: false, defaultValue: true },
      phone: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // renueva cada 24 h de uso
  },
  rateLimit: {
    enabled: process.env.NODE_ENV !== "test",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 5 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  databaseHooks: {
    user: {
      create: {
        // Todo usuario registrado obtiene su ficha de cliente.
        after: async (user) => {
          const u = user as typeof user & { phone?: string | null; role?: string };
          if (u.role && u.role !== "CUSTOMER") return;
          await db.customer.upsert({
            where: { userId: u.id },
            update: {},
            create: { userId: u.id, fullName: u.name, email: u.email, phone: u.phone ?? "" },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
