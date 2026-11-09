import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { legalDocs } from "@/config/legal";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const staticRoutes = [
    "",
    "/servicios",
    "/tienda",
    "/desarrollo-web",
    "/protocolos",
    "/seguimiento",
    "/contacto",
    "/nosotros",
    "/libro-de-reclamaciones",
  ];
  const [services, products] = await Promise.all([
    db.service.findMany({
      where: { active: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE", deletedAt: null, isDemo: false },
      select: { slug: true, updatedAt: true },
    }),
  ]).catch(() => [[], []] as const);
  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r}`,
      changeFrequency: "weekly" as const,
      priority: r === "" ? 1 : 0.7,
    })),
    ...legalDocs.map((d) => ({
      url: `${base}/legal/${d.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...services.map((s) => ({
      url: `${base}/servicios/${s.slug}`,
      lastModified: s.updatedAt,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/tienda/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
  ];
}
