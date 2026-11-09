import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/container";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Tu carrito" breadcrumbs={[{ href: "/tienda", label: "Tienda" }, { label: "Carrito" }]} />
      <Container className="py-10">
        <CartView />
      </Container>
    </>
  );
}
