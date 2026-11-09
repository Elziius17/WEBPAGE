import type { Metadata } from "next";
import {
  AdminPageHeader,
  DataTable,
  FilterBar,
  Pagination,
  TableEmpty,
  sp,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  await requireStaffPage("audit:read");
  const q = await searchParams;
  const action = sp(q.accion);
  const page = Math.max(1, Number(sp(q.pagina)) || 1);
  const where: Prisma.AuditLogWhereInput = action ? { action: { contains: action } } : {};
  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 40,
      take: 40,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Registro de auditoría"
        description="Cada operación administrativa queda registrada con fecha, hora, usuario y cambios."
      />
      <FilterBar action="/admin/auditoria">
        <Input
          name="accion"
          defaultValue={action}
          placeholder="Acción (p.ej. order., product.)"
          className="w-72"
          aria-label="Acción"
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </FilterBar>
      <DataTable
        head={["Fecha", "Usuario", "Acción", "Entidad", "Detalle"]}
        minWidth={900}
        empty={!logs.length && <TableEmpty>Sin registros.</TableEmpty>}
      >
        {logs.map((l) => (
          <tr key={l.id}>
            <td className="text-fg-muted text-xs whitespace-nowrap">
              {formatDateTime(l.createdAt)}
            </td>
            <td className="text-fg">
              {l.user?.name ?? "Sistema / cliente"}
              <p className="text-fg-subtle text-xs">{l.ip ?? ""}</p>
            </td>
            <td className="text-brand-cyan font-mono text-xs">{l.action}</td>
            <td className="text-fg-muted text-xs">
              {l.entity}
              <br />
              {l.entityId}
            </td>
            <td className="max-w-md">
              {(l.before || l.after) && (
                <details className="text-xs">
                  <summary className="text-fg-subtle hover:text-fg cursor-pointer">
                    Ver cambios
                  </summary>
                  <pre className="bg-ink-900 text-fg-muted mt-1 max-h-60 overflow-auto rounded p-2 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify({ antes: l.before, despues: l.after }, null, 2).slice(0, 4000)}
                  </pre>
                </details>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination
        page={page}
        pages={Math.ceil(total / 40)}
        buildHref={(n) =>
          `/admin/auditoria?${new URLSearchParams({ ...(action ? { accion: action } : {}), pagina: String(n) })}`
        }
      />
    </>
  );
}
