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
      <h1 className="text-2xl font-bold text-fg">Crear cuenta</h1>
      <p className="mt-1 mb-6 text-sm text-fg-muted">Registra tus pedidos y consulta tu historial.</p>
      <RegisterForm />
    </>
  );
}
