"use client";
import { createContext, use, useActionState, useEffect, useRef, startTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions";
import { cn } from "@/lib/utils/cn";

type State = ActionResult<unknown> | null;
type Action = (prev: State, fd: FormData) => Promise<State>;

const FormState = createContext<State>(null);

/**
 * Formulario del panel conectado a una Server Action.
 * Se envía con transición manual para no reiniciar los campos si hay errores.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  redirectTo,
  confirm,
  successMessage = true,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  redirectTo?: string | ((data: unknown) => string);
  confirm?: string;
  successMessage?: boolean;
}) {
  const [state, formAction] = useActionState<State, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (redirectTo) router.push(typeof redirectTo === "function" ? redirectTo(state.data) : redirectTo);
    }
  }, [state, resetOnSuccess, redirectTo, router]);

  return (
    <FormState value={state}>
      <form
        ref={ref}
        className={cn("space-y-4", className)}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
      >
        {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
        {state?.ok && successMessage && state.message && (
          <p role="status" className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden /> {state.message}
          </p>
        )}
        {children}
      </form>
    </FormState>
  );
}

export function useFieldError(name: string) {
  const s = use(FormState);
  if (!s || s.ok) return undefined;
  return s.fieldErrors?.[name]?.[0];
}

/** Campo con etiqueta y error de servidor. */
export function FormField({ name, label, hint, required, className, children }: { name: string; label: ReactNode; hint?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  const error = useFieldError(name);
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint} required={required} className={className}>
      {children}
    </Field>
  );
}

export function SubmitButton({ children, variant, size = "md", className, pendingLabel = "Guardando…" }: { children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" | "lg"; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
