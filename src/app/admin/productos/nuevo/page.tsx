import type { Metadata } from "next";
import Link from "next/link";
import { PencilLine, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { PhotoProductWizard } from "@/components/admin/photo-product-wizard";
import { requireStaffPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";
import { isProductAiEnabled } from "@/lib/ai/client";
import { findSuggestion } from "@/lib/market-suggestions";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProduct({ searchParams }: PageProps<"/admin/productos/nuevo">) {
  await requireStaffPage("products:write");
  const aiEnabled = isProductAiEnabled();
  const params = await searchParams;
  const mode = aiEnabled && params.modo === "foto" ? "foto" : "manual";
  const suggestion = findSuggestion(
    typeof params.sugerencia === "string" ? params.sugerencia : undefined,
  );
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
      {aiEnabled && (
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
      )}
      {suggestion && (
        <Alert tone="info" className="mb-6">
          Precargado desde <strong>Productos sugeridos</strong>. Revisa los datos, define precio,
          proveedor y stock, y sube las fotos antes de publicar.
        </Alert>
      )}
      {mode === "foto" ? (
        <PhotoProductWizard categories={categories} suppliers={suppliers} />
      ) : (
        <ProductForm
          key={suggestion?.id ?? "manual"}
          categories={categories}
          suppliers={suppliers}
          draft={
            suggestion && {
              name: suggestion.name,
              brand: suggestion.brand,
              model: suggestion.model,
              categoryId: categories.find((c) => c.slug === suggestion.category)?.id,
              condition: "NEW",
              shortDescription: suggestion.shortDescription,
              description: suggestion.description,
              specs: suggestion.specs,
            }
          }
          reference={
            suggestion && {
              priceRangePEN: suggestion.priceRangePEN,
              officialUrl: suggestion.officialUrl,
            }
          }
        />
      )}
    </>
  );
}
