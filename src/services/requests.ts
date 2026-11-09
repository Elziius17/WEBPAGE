import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { publicRequestSchema } from "@/lib/validations/public";

type Data = z.output<typeof publicRequestSchema>;

export async function createPublicRequest(data: Data) {
  const [service, product] = await Promise.all([
    data.serviceSlug ? db.service.findFirst({ where: { slug: data.serviceSlug, active: true }, select: { id: true } }) : null,
    data.productSlug ? db.product.findFirst({ where: { slug: data.productSlug, deletedAt: null }, select: { id: true } }) : null,
  ]);
  return db.serviceRequest.create({
    data: {
      kind: data.kind,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone,
      company: data.company ?? null,
      deviceType: data.deviceType ?? null,
      subject: data.subject ?? null,
      message: data.message,
      preferredContact: data.preferredContact ?? null,
      serviceId: service?.id ?? null,
      productId: product?.id ?? null,
      consentAt: new Date(),
    },
    select: { id: true },
  });
}
