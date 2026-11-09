import { expect, test } from "@playwright/test";

test("compra: carrito y pedido con confirmación por WhatsApp", async ({ page }) => {
  await page.goto("/tienda?stock=1");
  await page.locator("article h3 a").first().click();
  await page.locator("main button", { hasText: "Agregar al carrito" }).first().click();
  await page.goto("/carrito");
  await expect(page.getByText("Resumen de compra")).toBeVisible();
  await page.getByRole("link", { name: /Continuar/ }).click();
  await page.fill("#contactName", "Cliente E2E");
  await page.fill("#contactPhone", "987654321");
  await page.locator("input[name=consent]").check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("¡Pedido registrado!")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/PE-[0-9A-Z]{4}-[0-9A-Z]{4}/)).toBeVisible();
  await expect(page.getByText("Aún no se ha realizado ningún cobro")).toBeVisible();
});

test("checkout con courier exige dirección", async ({ page }) => {
  await page.goto("/tienda?stock=1");
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /Agregar/ })
    .click();
  await page.goto("/checkout");
  await page.fill("#contactName", "Cliente E2E");
  await page.fill("#contactPhone", "987654321");
  await page.getByText("Envío por courier").click();
  await page.locator("input[name=consent]").check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("Campo obligatorio para envíos").first()).toBeVisible();
});
