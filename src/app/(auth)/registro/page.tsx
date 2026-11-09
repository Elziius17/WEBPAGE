import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/mi-cuenta");
  return (
    <>
      <h1 className="text-fg text-2xl font-bold">Crear cuenta</h1>
      <p className="text-fg-muted mt-1 mb-6 text-sm">
        Registra tus pedidos y consulta tu historial.
      </p>
      <RegisterForm />
    </>
  );
}
