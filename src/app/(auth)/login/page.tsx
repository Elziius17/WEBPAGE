import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/security/permissions";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const user = await getCurrentUser();
  if (user) redirect(isStaff(user.role) ? "/admin" : "/mi-cuenta");
  return (
    <>
      <h1 className="text-fg text-2xl font-bold">Iniciar sesión</h1>
      <p className="text-fg-muted mt-1 mb-6 text-sm">Accede a tus pedidos y servicios.</p>
      <LoginForm next={next} />
    </>
  );
}
