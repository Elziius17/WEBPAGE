import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getBusinessSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } };

export default async function CheckoutPage() {
  const [zones, user, settings] = await Promise.all([
    db.deliveryZone.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        baseCostCents: true,
        costIsMinimum: true,
        estimatedTime: true,
      },
    }),
    getCurrentUser(),
    getBusinessSettings(),
  ]);
  const customer = user
    ? await db.customer.findUnique({
        where: { userId: user.id },
        select: { fullName: true, email: true, phone: true },
      })
    : null;
  return (
    <>
      <PageHero
        title="Finalizar pedido"
        breadcrumbs={[{ href: "/carrito", label: "Carrito" }, { label: "Checkout" }]}
      />
      <Container className="py-10">
        <CheckoutForm
          zones={zones}
          pickupInstructions={settings.pickupInstructions || undefined}
          defaults={{
            name: customer?.fullName ?? user?.name,
            email: customer?.email ?? user?.email,
            phone: customer?.phone || undefined,
          }}
        />
      </Container>
    </>
  );
}
