import { expect, test } from "@playwright/test";

test.describe("sitio público", () => {
  test("la página de inicio muestra el mensaje principal y navega", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "La tecnología que necesitas",
    );
    for (const path of [
      "/servicios",
      "/tienda",
      "/desarrollo-web",
      "/protocolos",
      "/nosotros",
      "/contacto",
      "/seguimiento",
      "/legal/privacidad",
      "/libro-de-reclamaciones",
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("no hay desbordamiento horizontal", async ({ page }) => {
    for (const path of ["/", "/tienda", "/seguimiento"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });

  test("los formularios validan en el cliente", async ({ page }) => {
    await page.goto("/contacto");
    await page.getByRole("button", { name: /Enviar solicitud/ }).click();
    await expect(page.getByText("Ingresa tu nombre")).toBeVisible();
    await expect(page.getByText("Debes aceptar la política de privacidad")).toBeVisible();
  });

  test("el seguimiento no revela si un código existe", async ({ page }) => {
    await page.goto("/seguimiento");
    await page.fill("#code", "EZ-0000-0000");
    await page.fill("#verifier", "nadie@test.pe");
    await page.getByRole("button", { name: /Consultar/ }).click();
    await expect(page.getByText("No encontramos una orden con esos datos")).toBeVisible();
  });

  test("SEO: robots y sitemap", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);
    const sm = await request.get("/sitemap.xml");
    expect(sm.status()).toBe(200);
    expect(await sm.text()).toContain("/servicios/mantenimiento-preventivo");
  });
});
