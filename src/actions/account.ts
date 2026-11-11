"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handleActionError, validationError, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/security/permissions";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";
import { customerTestimonialSchema } from "@/lib/validations/public";
import { upsertCustomerTestimonial } from "@/services/testimonials";

type CustomerCheck =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; error: string };

async function requireCustomer(): Promise<CustomerCheck> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Inicia sesión para continuar." };
  if (isStaff(user.role))
    return { ok: false, error: "Las cuentas del personal no pueden publicar testimonios." };
  return { ok: true, user };
}

export async function submitTestimonialAction(input: unknown): Promise<ActionResult> {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return { ok: false, error: auth.error };
    const parsed = customerTestimonialSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const rl = await rateLimit("testimonial", auth.user.id, { limit: 5, windowSeconds: 3600 });
    if (!rl.ok)
      return {
        ok: false,
        error: `Has editado tu opinión varias veces. Intenta en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
      };
    const t = await upsertCustomerTestimonial(auth.user.id, parsed.data);
    await audit({
      userId: auth.user.id,
      action: "testimonial.submit",
      entity: "Testimonial",
      entityId: t.id,
      after: { rating: t.rating, verified: t.verified },
    });
    revalidatePath("/mi-cuenta");
    revalidatePath("/admin/configuracion");
    revalidatePath("/");
    return {
      ok: true,
      message: "¡Gracias! Tu opinión se publicará cuando nuestro equipo la revise.",
    };
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteOwnTestimonialAction(): Promise<ActionResult> {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return { ok: false, error: auth.error };
    const { count } = await db.testimonial.deleteMany({ where: { userId: auth.user.id } });
    if (count)
      await audit({
        userId: auth.user.id,
        action: "testimonial.delete_own",
        entity: "Testimonial",
      });
    revalidatePath("/mi-cuenta");
    revalidatePath("/admin/configuracion");
    revalidatePath("/");
    return { ok: true, message: "Eliminamos tu opinión." };
  } catch (e) {
    return handleActionError(e);
  }
}
