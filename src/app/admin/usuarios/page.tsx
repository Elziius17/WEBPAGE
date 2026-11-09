import type { Metadata } from "next";
import { AdminPageHeader, DataTable, Panel } from "@/components/admin/ui";
import { ActionForm, FormField, SubmitButton } from "@/components/admin/action-form";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils/dates";
import { roleLabel } from "@/config/statuses";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/security/permissions";
import { createStaffUserAction, updateUserRoleAction } from "@/actions/admin/management";

export const metadata: Metadata = { title: "Usuarios y roles" };

export default async function UsersPage() {
  const me = await requireStaffPage("users:manage");
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <>
      <AdminPageHeader
        title="Usuarios y roles"
        description="Control de acceso basado en roles (RBAC), validado en el servidor."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <DataTable head={["Usuario", "Rol y estado", "Registrado"]} minWidth={640}>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <p className="text-fg">{u.name}</p>
                <p className="text-fg-subtle text-xs">{u.email}</p>
              </td>
              <td>
                <ActionForm
                  action={updateUserRoleAction}
                  className="flex flex-wrap items-center gap-2 space-y-0"
                >
                  <input type="hidden" name="userId" value={u.id} />
                  <Select
                    name="role"
                    defaultValue={u.role}
                    className="h-9 w-40"
                    aria-label={`Rol de ${u.name}`}
                    disabled={u.id === me.id}
                  >
                    {Object.entries(roleLabel).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  {u.id === me.id && <input type="hidden" name="role" value={u.role} />}
                  <label className="text-fg-muted flex items-center gap-1.5 text-xs">
                    <Checkbox name="active" defaultChecked={u.active} disabled={u.id === me.id} />{" "}
                    Activo
                  </label>
                  {u.id === me.id ? (
                    <>
                      <input type="hidden" name="active" value="on" />
                      <span className="text-fg-subtle text-xs">(tú)</span>
                    </>
                  ) : (
                    <SubmitButton size="sm" variant="secondary">
                      Aplicar
                    </SubmitButton>
                  )}
                </ActionForm>
              </td>
              <td className="text-fg-muted text-xs">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
        <div className="space-y-6">
          <Panel title="Crear usuario del equipo">
            <ActionForm action={createStaffUserAction} resetOnSuccess>
              <FormField name="name" label="Nombre" required>
                <Input id="u-name" name="name" />
              </FormField>
              <FormField name="email" label="Correo" required>
                <Input id="u-email" name="email" type="email" />
              </FormField>
              <FormField name="role" label="Rol">
                <Select id="u-role" name="role">
                  <option value="TECHNICIAN">Técnico</option>
                  <option value="SALES">Ventas</option>
                  <option value="ADMIN">Administrador</option>
                </Select>
              </FormField>
              <FormField name="password" label="Contraseña inicial" hint="Mínimo 10 caracteres">
                <Input id="u-pass" name="password" type="password" autoComplete="new-password" />
              </FormField>
              <SubmitButton className="w-full">Crear usuario</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="Permisos por rol">
            <div className="space-y-4 text-xs">
              {(["ADMIN", "SALES", "TECHNICIAN", "CUSTOMER"] as const).map((r) => (
                <div key={r}>
                  <p className="text-fg mb-1 font-semibold">{roleLabel[r]}</p>
                  <p className="text-fg-muted">
                    {r === "CUSTOMER"
                      ? "Solo consulta sus propios pedidos y servicios (Mi cuenta)."
                      : r === "ADMIN"
                        ? "Acceso completo."
                        : ROLE_PERMISSIONS[r].map((p) => PERMISSIONS[p]).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
