import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";

export async function makeAdmin(): Promise<CurrentUser> {
  await db.role.upsert({
    where: { key: "ADMIN" },
    update: {},
    create: { key: "ADMIN", name: "Administrador" },
  });
  await db.role.upsert({
    where: { key: "CUSTOMER" },
    update: {},
    create: { key: "CUSTOMER", name: "Cliente" },
  });
  const id = randomUUID();
  const u = await db.user.create({
    data: { id, email: `admin-${id}@test.pe`, name: "Admin Test", role: "ADMIN" },
  });
  return { id: u.id, name: u.name, email: u.email, role: "ADMIN" };
}

export async function makeProduct(stock: number, priceCents = 10000) {
  const slug = `p-${randomUUID().slice(0, 8)}`;
  const cat = await db.category.upsert({
    where: { slug: "test" },
    update: {},
    create: { slug: "test", name: "Test" },
  });
  const p = await db.product.create({
    data: {
      sku: slug.toUpperCase(),
      slug,
      name: `Producto ${slug}`,
      brand: "Test",
      categoryId: cat.id,
      description: "Producto de prueba",
      priceCents,
      stock,
      status: "ACTIVE",
    },
  });
  return p;
}

export const checkout = (
  items: { productId: string; quantity: number }[],
  extra: Record<string, unknown> = {},
) => ({
  idempotencyKey: randomUUID(),
  items,
  contactName: "Cliente Test",
  contactPhone: "987654321",
  contactEmail: "cliente@test.pe",
  deliveryMethod: "PICKUP" as const,
  consent: true as const,
  ...extra,
});
