import type { Metadata } from "next";
import Link from "next/link";
import { PencilLine, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { PhotoProductWizard } from "@/components/admin/photo-product-wizard";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProduct({ searchParams }: PageProps<"/admin/productos/nuevo">) {
  await requireStaffPage("products:write");
  const mode = (await searchParams).modo === "foto" ? "foto" : "manual";
  const [categories, suppliers] = await Promise.all([
    db.category.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const tabs = [
    { key: "manual", href: "/admin/productos/nuevo", label: "Registro manual", icon: PencilLine },
    {
      key: "foto",
      href: "/admin/productos/nuevo?modo=foto",
      label: "Registrar con foto (IA)",
      icon: Sparkles,
    },
  ] as const;
  return (
    <>
      <AdminPageHeader
        title="Nuevo producto"
        back={{ href: "/admin/productos", label: "Productos" }}
      />
      <nav aria-label="Forma de registro" className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ key, href, label, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            aria-current={mode === key ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              mode === key
                ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                : "text-fg-muted hover:text-fg border-white/10",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
      {mode === "foto" ? (
        <PhotoProductWizard categories={categories} suppliers={suppliers} />
      ) : (
        <ProductForm categories={categories} suppliers={suppliers} />
      )}
    </>
  );
}
