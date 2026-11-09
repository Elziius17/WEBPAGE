import { ActionForm, FormField, SubmitButton } from "./action-form";
import { Input, Select, Textarea } from "@/components/ui/form";
import { saveCustomerAction } from "@/actions/admin/management";
import type { Customer } from "@/generated/prisma/client";

export function CustomerForm({ c }: { c?: Customer }) {
  return (
    <ActionForm action={saveCustomerAction} redirectPrefix={c ? undefined : "/admin/clientes/"}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="fullName" label="Nombre completo" required>
          <Input id="fullName" name="fullName" defaultValue={c?.fullName} />
        </FormField>
        <FormField name="type" label="Tipo">
          <Select id="type" name="type" defaultValue={c?.type ?? "PERSON"}>
            <option value="PERSON">Persona</option>
            <option value="COMPANY">Empresa</option>
          </Select>
        </FormField>
        <FormField name="companyName" label="Razón social">
          <Input id="companyName" name="companyName" defaultValue={c?.companyName ?? ""} />
        </FormField>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <FormField name="documentType" label="Doc.">
            <Select id="documentType" name="documentType" defaultValue={c?.documentType ?? ""}>
              <option value="">—</option>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">C.E.</option>
              <option value="PASSPORT">Pasaporte</option>
            </Select>
          </FormField>
          <FormField name="documentNumber" label="Número">
            <Input
              id="documentNumber"
              name="documentNumber"
              defaultValue={c?.documentNumber ?? ""}
            />
          </FormField>
        </div>
        <FormField name="phone" label="Teléfono" required>
          <Input id="phone" name="phone" defaultValue={c?.phone} />
        </FormField>
        <FormField name="email" label="Correo">
          <Input id="email" name="email" type="email" defaultValue={c?.email ?? ""} />
        </FormField>
      </div>
      <FormField name="internalNotes" label="Notas internas">
        <Textarea
          id="internalNotes"
          name="internalNotes"
          rows={2}
          defaultValue={c?.internalNotes ?? ""}
        />
      </FormField>
      <SubmitButton size="sm">{c ? "Guardar cambios" : "Registrar cliente"}</SubmitButton>
    </ActionForm>
  );
}
