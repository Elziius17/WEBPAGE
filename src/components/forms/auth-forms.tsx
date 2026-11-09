"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { loginSchema, registerSchema } from "@/lib/validations/public";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

/** Solo se permiten redirecciones internas (evita open redirect). */
function safeNext(next?: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = (d: z.output<typeof loginSchema>) =>
    start(async () => {
      setError(null);
      const { error } = await authClient.signIn.email({ email: d.email, password: d.password });
      if (error) {
        setError(
          error.status === 429
            ? "Demasiados intentos. Espera un minuto e inténtalo nuevamente."
            : "Correo o contraseña incorrectos.",
        );
        return;
      }
      router.replace(safeNext(next) ?? "/mi-cuenta");
      router.refresh();
    });
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
      <p className="text-fg-muted text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-brand-cyan hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });
  const onSubmit = (d: z.output<typeof registerSchema>) =>
    start(async () => {
      setError(null);
      const { error } = await authClient.signUp.email({
        name: d.name,
        email: d.email,
        password: d.password,
        phone: d.phone,
      } as Parameters<typeof authClient.signUp.email>[0]);
      if (error) {
        setError(
          error.status === 429
            ? "Demasiados intentos. Inténtalo más tarde."
            : error.code === "USER_ALREADY_EXISTS" || error.status === 422
              ? "Ya existe una cuenta con ese correo."
              : "No pudimos crear tu cuenta. Revisa los datos.",
        );
        return;
      }
      router.replace("/mi-cuenta");
      router.refresh();
    });
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Nombre completo" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" {...register("name")} />
      </Field>
      <Field label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <Field
        label="Contraseña"
        htmlFor="password"
        error={errors.password?.message}
        hint="Mínimo 10 caracteres, con letras y números."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
      </Field>
      <Field
        label="Confirmar contraseña"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </Field>
      <label className="text-fg-muted flex items-start gap-2.5 text-sm">
        <Checkbox className="mt-0.5" {...register("consent")} />
        <span>
          Acepto los{" "}
          <Link href="/legal/terminos" target="_blank" className="text-brand-cyan hover:underline">
            Términos
          </Link>{" "}
          y la{" "}
          <Link
            href="/legal/privacidad"
            target="_blank"
            className="text-brand-cyan hover:underline"
          >
            Política de privacidad
          </Link>
          .
        </span>
      </label>
      {errors.consent && (
        <p role="alert" className="text-danger text-xs">
          {errors.consent.message}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
      <p className="text-fg-muted text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand-cyan hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          router.replace("/");
          router.refresh();
        })
      }
    >
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}
