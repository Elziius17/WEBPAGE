import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { CustomerForm } from "@/components/admin/customer-form";
import { requireStaffPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NewCustomer() {
  await requireStaffPage("customers:write");
  return (
    <>
      <AdminPageHeader title="Nuevo cliente" back={{ href: "/admin/clientes", label: "Clientes" }} />
      <Panel><CustomerForm /></Panel>
    </>
  );
}
