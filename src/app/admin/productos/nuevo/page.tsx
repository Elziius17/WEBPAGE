import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProduct() {
  await requireStaffPage("products:write");
  const [categories, suppliers] = await Promise.all([
    db.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Nuevo producto"
        back={{ href: "/admin/productos", label: "Productos" }}
      />
      <ProductForm categories={categories} suppliers={suppliers} />
    </>
  );
}
