import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { customerTestimonialSchema } from "@/lib/validations/public";

type Data = z.output<typeof customerTestimonialSchema>;

/** Testimonios aprobados para la página de inicio (los más recientes primero). */
export function getPublishedTestimonials(take = 6) {
  return db.testimonial.findMany({
    where: { approved: true },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      authorName: true,
      authorRole: true,
      content: true,
      rating: true,
      verified: true,
    },
  });
}

/** Un cliente es "verificado" si tiene al menos un pedido completado o un equipo entregado. */
export async function isVerifiedCustomer(userId: string): Promise<boolean> {
  const customer = await db.customer.findUnique({
    where: { userId },
    select: {
      _count: {
        select: {
          orders: { where: { status: "COMPLETED" } },
          serviceOrders: { where: { status: "DELIVERED" } },
        },
      },
    },
  });
  return !!customer && customer._count.orders + customer._count.serviceOrders > 0;
}

export function getOwnTestimonial(userId: string) {
  return db.testimonial.findUnique({
    where: { userId },
    select: {
      id: true,
      authorName: true,
      authorRole: true,
      content: true,
      rating: true,
      approved: true,
      verified: true,
      updatedAt: true,
    },
  });
}

/**
 * Crea o actualiza el testimonio del cliente (uno por cuenta).
 * Toda edición vuelve a quedar pendiente de aprobación por el personal.
 */
export async function upsertCustomerTestimonial(userId: string, d: Data) {
  const verified = await isVerifiedCustomer(userId);
  const data = {
    authorName: d.authorName,
    authorRole: d.authorRole ?? null,
    content: d.content,
    rating: d.rating,
    approved: false,
    verified,
    consentAt: new Date(),
  };
  return db.testimonial.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
