/* eslint-disable no-console */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../src/lib/security/permissions";
import { servicesSeed, categoriesSeed } from "./data/services";
import { demoProducts } from "./data/demo";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const roleMeta = {
  ADMIN: { name: "Administrador", description: "Acceso completo a la plataforma" },
  TECHNICIAN: { name: "Técnico", description: "Órdenes y diagnósticos asignados" },
  SALES: { name: "Ventas", description: "Productos, pedidos, entregas y clientes" },
  CUSTOMER: { name: "Cliente", description: "Consulta de sus pedidos y solicitudes" },
} as const;

async function seedRbac() {
  for (const [key, meta] of Object.entries(roleMeta)) {
    await db.role.upsert({
      where: { key: key as keyof typeof roleMeta },
      update: meta,
      create: { key: key as keyof typeof roleMeta, ...meta },
    });
  }
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
  const perms = await db.permission.findMany();
  for (const [roleKey, list] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await db.role.findUniqueOrThrow({
      where: { key: roleKey as keyof typeof roleMeta },
    });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    const ids = perms
      .filter((p) => (list as readonly string[]).includes(p.key))
      .map((p) => ({ roleId: role.id, permissionId: p.id }));
    if (ids.length) await db.rolePermission.createMany({ data: ids });
  }
  console.log("✔ Roles y permisos");
}

async function createStaffUser(
  email: string,
  name: string,
  password: string,
  role: "ADMIN" | "TECHNICIAN" | "SALES",
) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  const id = randomUUID();
  const user = await db.user.create({ data: { id, email, name, role, emailVerified: true } });
  await db.account.create({
    data: {
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
    },
  });
  if (role === "TECHNICIAN")
    await db.technician.create({ data: { userId: id, specialty: "Hardware y software" } });
  return user;
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "⚠ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD no definidos: se omite el administrador.",
    );
    return;
  }
  if (password.length < 10)
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres");
  await createStaffUser(
    email.toLowerCase(),
    process.env.SEED_ADMIN_NAME ?? "Administrador ELZIIUS",
    password,
    "ADMIN",
  );
  console.log(`✔ Administrador: ${email}`);
}

async function seedCatalog() {
  for (const [i, s] of servicesSeed.entries()) {
    const data = {
      name: s.name,
      icon: s.icon,
      shortDescription: s.shortDescription,
      description: s.description,
      benefits: [...s.benefits],
      activities: [...s.activities],
      procedure: [...s.procedure],
      sortOrder: i,
    };
    await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: { slug: s.slug, code: s.code, ...data },
    });
  }
  for (const [i, c] of categoriesSeed.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, sortOrder: i },
    });
  }
  await db.businessConfiguration.upsert({
    where: { key: "qc.template" },
    update: {},
    create: {
      key: "qc.template",
      value: [
        "Encendido",
        "Temperaturas",
        "Memoria RAM",
        "Almacenamiento",
        "Conectividad",
        "Periféricos",
        "Estabilidad",
        "Funcionamiento general",
      ],
    },
  });
  console.log("✔ Servicios, categorías y checklist de calidad");
}

async function seedDemo() {
  if (process.env.SEED_DEMO_DATA !== "true") return;
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  for (const p of demoProducts) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: p.category } });
    const slug = p.sku.toLowerCase();
    const exists = await db.product.findUnique({ where: { sku: p.sku } });
    if (exists) continue;
    const priceCents = Math.round(p.price * 100);
    const product = await db.product.create({
      data: {
        sku: p.sku,
        slug,
        name: p.name,
        brand: p.brand,
        model: p.model,
        categoryId: category.id,
        shortDescription: "Producto de demostración para probar la tienda. No es una oferta real.",
        description:
          "Este es un producto de DEMOSTRACIÓN cargado por el seed. Reemplázalo por productos reales desde el panel administrativo antes de publicar la tienda.",
        specs: p.specs.map(([label, value]) => ({ label, value })),
        priceCents,
        compareAtPriceCents: "compareAt" in p ? Math.round(p.compareAt * 100) : null,
        costCents: Math.round(priceCents * 0.78),
        stock: 0,
        minStock: 2,
        status: "ACTIVE",
        featured: "featured" in p ? p.featured : false,
        warrantyMonths: p.warranty,
        isDemo: true,
      },
    });
    if (p.stock > 0) {
      await db.product.update({ where: { id: product.id }, data: { stock: p.stock } });
      await db.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "ENTRY",
          stockDelta: p.stock,
          stockAfter: p.stock,
          reservedAfter: 0,
          reason: "[DEMO] Stock inicial",
          userId: admin?.id,
        },
      });
    }
  }
  await db.deliveryZone.upsert({
    where: { name: "[DEMO] Zona de ejemplo" },
    update: {},
    create: {
      name: "[DEMO] Zona de ejemplo",
      description: "Zona de demostración. Configura tus zonas y costos reales en Admin > Entregas.",
      baseCostCents: null,
    },
  });
  await db.courier.upsert({
    where: { name: "[DEMO] Courier de ejemplo" },
    update: {},
    create: {
      name: "[DEMO] Courier de ejemplo",
      notes: "Courier de demostración. Registra los couriers reales con los que trabajas.",
    },
  });
  await createStaffUser(
    "tecnico.demo@elziius.local",
    "[DEMO] Técnico",
    "DemoTecnico#2026",
    "TECHNICIAN",
  );
  await createStaffUser("ventas.demo@elziius.local", "[DEMO] Ventas", "DemoVentas#2026", "SALES");
  const t = await db.testimonial.count({ where: { isDemo: true } });
  if (!t) {
    await db.testimonial.createMany({
      data: [
        {
          authorName: "[DEMO] Cliente de ejemplo",
          authorRole: "Testimonio de demostración",
          content:
            "Espacio reservado para testimonios reales de clientes. Este texto es de demostración.",
          rating: 5,
          approved: false,
          isDemo: true,
        },
      ],
    });
  }
  console.log("✔ Datos de demostración [DEMO]");
}

async function main() {
  await seedRbac();
  await seedAdmin();
  await seedCatalog();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
