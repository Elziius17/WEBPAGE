import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { publicUrl } from "@/lib/storage";

export const SORT_OPTIONS = {
  relevance: "Destacados",
  newest: "Más recientes",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  name: "Nombre (A-Z)",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;

export type CatalogFilters = {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number; // céntimos
  maxPrice?: number;
  inStock?: boolean;
  promo?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

const publicWhere: Prisma.ProductWhereInput = { status: "ACTIVE", deletedAt: null };

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  model: true,
  priceCents: true,
  compareAtPriceCents: true,
  stock: true,
  reserved: true,
  condition: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function availableUnits(p: { stock: number; reserved: number }) {
  return Math.max(0, p.stock - p.reserved);
}

export async function listProducts(f: CatalogFilters) {
  const pageSize = Math.min(f.pageSize ?? 12, 48);
  const page = Math.max(1, f.page ?? 1);
  const where: Prisma.ProductWhereInput = { ...publicWhere };
  const and: Prisma.ProductWhereInput[] = [];
  if (f.q) {
    const q = f.q.slice(0, 80);
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.brand) and.push({ brand: { equals: f.brand, mode: "insensitive" } });
  if (f.minPrice !== undefined) and.push({ priceCents: { gte: f.minPrice } });
  if (f.maxPrice !== undefined) and.push({ priceCents: { lte: f.maxPrice } });
  if (f.inStock) and.push({ stock: { gt: 0 } });
  if (f.promo) and.push({ compareAtPriceCents: { not: null } });
  if (and.length) where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.sort === "price-asc"
      ? [{ priceCents: "asc" }]
      : f.sort === "price-desc"
        ? [{ priceCents: "desc" }]
        : f.sort === "newest"
          ? [{ createdAt: "desc" }]
          : f.sort === "name"
            ? [{ name: "asc" }]
            : [{ featured: "desc" }, { createdAt: "desc" }];

  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      select: productCardSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    where: { ...publicWhere, featured: true },
    select: productCardSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { ...publicWhere, slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  return db.product.findMany({
    where: { ...publicWhere, categoryId, id: { not: productId } },
    select: productCardSelect,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getCategoriesWithCount() {
  const cats = await db.category.findMany({
    where: { active: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      _count: { select: { products: { where: publicWhere } } },
    },
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    count: c._count.products,
  }));
}

export async function getBrands() {
  const rows = await db.product.findMany({
    where: publicWhere,
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand);
}

/** Productos para el carrito: precios y stock SIEMPRE desde la BD. */
export async function getCartProducts(ids: string[]) {
  if (!ids.length) return [];
  const rows = await db.product.findMany({
    where: { id: { in: ids.slice(0, 30) }, ...publicWhere },
    select: productCardSelect,
  });
  return rows;
}

export { publicUrl };
