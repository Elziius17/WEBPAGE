import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { setProductStatusAction } from "@/actions/admin/catalog";
import type { ReadinessCheck } from "@/services/product-readiness";

const statusText: Record<string, { title: string; tone: string }> = {
  ACTIVE: { title: "Publicado en la tienda", tone: "text-success" },
  DRAFT: {
    title: "Borrador: no aparece en la tienda ni cuenta como disponible",
    tone: "text-warning",
  },
  INACTIVE: { title: "Inactivo: oculto en la tienda", tone: "text-fg-muted" },
  DISCONTINUED: { title: "Descontinuado", tone: "text-fg-muted" },
};

export function ProductPublishPanel({
  id,
  status,
  checks,
  ready,
  canWrite,
}: {
  id: string;
  status: string;
  checks: ReadinessCheck[];
  ready: boolean;
  canWrite: boolean;
}) {
  const s = statusText[status] ?? statusText.DRAFT!;
  return (
    <Panel title="Publicación">
      <p className={`text-sm font-medium ${s.tone}`}>{s.title}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.key} className="flex items-start gap-2">
            {c.ok ? (
              <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
            ) : c.required ? (
              <CircleAlert className="text-danger mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <CircleDashed className="text-fg-subtle mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span className={c.ok ? "text-fg-muted" : c.required ? "text-fg" : "text-fg-subtle"}>
              {c.label}
              {!c.ok && !c.required && " (recomendado)"}
            </span>
          </li>
        ))}
      </ul>
      {canWrite && (
        <ActionForm action={setProductStatusAction} className="mt-5 space-y-0">
          <input type="hidden" name="id" value={id} />
          {status === "ACTIVE" ? (
            <>
              <input type="hidden" name="status" value="DRAFT" />
              <SubmitButton size="sm" variant="secondary">
                Retirar de la tienda
              </SubmitButton>
            </>
          ) : (
            <>
              <input type="hidden" name="status" value="ACTIVE" />
              <SubmitButton size="sm" disabled={!ready}>
                Publicar en la tienda
              </SubmitButton>
              {!ready && (
                <p className="text-fg-subtle mt-2 text-xs">
                  Completa los puntos en rojo para poder publicarlo.
                </p>
              )}
            </>
          )}
        </ActionForm>
      )}
    </Panel>
  );
}
