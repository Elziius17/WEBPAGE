import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { publicRequestSchema } from "@/lib/validations/public";
import {
  pcBudgets,
  pcCpuPrefs,
  pcExtras,
  pcGpuPrefs,
  pcRamPrefs,
  pcResolutions,
  pcStoragePrefs,
  pcTimelines,
  pcUses,
} from "@/config/pc-build";
import type { pcBuildSchema } from "@/lib/validations/public";

type Data = z.output<typeof publicRequestSchema>;

export async function createPublicRequest(data: Data) {
  const [service, product] = await Promise.all([
    data.serviceSlug
      ? db.service.findFirst({
          where: { slug: data.serviceSlug, active: true },
          select: { id: true },
        })
      : null,
    data.productSlug
      ? db.product.findFirst({
          where: { slug: data.productSlug, deletedAt: null },
          select: { id: true },
        })
      : null,
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

// --- Cotizar PC completa ---

type PcData = z.output<typeof pcBuildSchema>;

/** Resumen legible de la cotización (se guarda en el mensaje y se muestra en el panel). */
export function pcBuildSummary(d: PcData): { label: string; value: string }[] {
  return [
    { label: "Uso principal", value: pcUses[d.use] },
    { label: "Presupuesto", value: pcBudgets[d.budget] },
    { label: "Procesador", value: pcCpuPrefs[d.cpu] },
    { label: "Tarjeta de video", value: pcGpuPrefs[d.gpu] },
    { label: "Memoria RAM", value: pcRamPrefs[d.ram] },
    { label: "Almacenamiento", value: pcStoragePrefs[d.storage] },
    { label: "Resolución objetivo", value: pcResolutions[d.resolution] },
    { label: "Incluir", value: d.extras.map((e) => pcExtras[e]).join(", ") || "—" },
    { label: "Juegos / programas", value: d.software ?? "—" },
    { label: "Componentes a reutilizar", value: d.reuse ?? "—" },
    { label: "Plazo", value: pcTimelines[d.timeline] },
    { label: "Ciudad / distrito", value: d.city ?? "—" },
  ];
}

export async function createPcBuildRequest(d: PcData, customerId: string | null) {
  const summary = pcBuildSummary(d);
  const message = [
    ...summary.map((s) => `${s.label}: ${s.value}`),
    d.notes ? `\nComentarios: ${d.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return db.serviceRequest.create({
    data: {
      kind: "PC_BUILD",
      name: d.name,
      email: d.email ?? null,
      phone: d.phone,
      subject: `PC ${pcUses[d.use].toLowerCase()} · ${pcBudgets[d.budget]}`,
      message,
      preferredContact: d.preferredContact ?? null,
      customerId,
      consentAt: new Date(),
      details: {
        use: d.use,
        budget: d.budget,
        cpu: d.cpu,
        gpu: d.gpu,
        ram: d.ram,
        storage: d.storage,
        resolution: d.resolution,
        timeline: d.timeline,
        extras: d.extras,
        software: d.software ?? null,
        reuse: d.reuse ?? null,
        notes: d.notes ?? null,
        city: d.city ?? null,
      },
    },
    select: { id: true, createdAt: true },
  });
}
