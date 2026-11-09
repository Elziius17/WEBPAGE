import { expect, test, type Page } from "@playwright/test";

const ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@elziius.local",
  password: process.env.SEED_ADMIN_PASSWORD ?? "CambiarEstaClave#2026",
};

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("el panel exige autenticación", async ({ page, request }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  expect((await request.get("/api/admin/service-orders/x/pdf")).status()).toBe(403);
});

test("credenciales incorrectas muestran un error genérico", async ({ page }) => {
  await login(page, ADMIN.email, "incorrecta-123");
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("el administrador gestiona una orden técnica de punta a punta", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await page.goto("/admin/ordenes/nueva");
  await page.getByRole("radio", { name: "Nuevo cliente" }).click();
  await page.fill("#customerName", "Cliente E2E Técnico");
  await page.fill("#customerPhone", "955444333");
  await page.fill("#brand", "Asus");
  await page.fill("#reportedIssue", "Pantalla azul al iniciar");
  await page.getByRole("button", { name: /Registrar recepción/ }).click();
  await expect(page).toHaveURL(/\/admin\/ordenes\/[a-z0-9]+$/, { timeout: 15_000 });
  const code = (await page.locator("h1 .font-mono").innerText()).trim();
  expect(code).toMatch(/^EZ-/);

  const res = await page.request.get(
    page.url().replace("/admin/ordenes/", "/api/admin/service-orders/") + "/pdf",
  );
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");

  const pub = await page.context().browser()!.newPage();
  await pub.goto(`/seguimiento?codigo=${code}`);
  await pub.fill("#verifier", "955444333");
  await pub.getByRole("button", { name: /Consultar/ }).click();
  await expect(pub.getByText("Historial de actualizaciones")).toBeVisible();
  await expect(pub.getByText("Recibido").first()).toBeVisible();
});

test("un cliente registrado no puede entrar al panel", async ({ page }) => {
  await page.goto("/registro");
  await page.fill("#name", "Cliente E2E");
  await page.fill("#email", `e2e-${Date.now()}@test.pe`);
  await page.fill("#phone", "912345678");
  await page.fill("#password", "ClaveSegura123");
  await page.fill("#confirmPassword", "ClaveSegura123");
  await page.locator("input[name=consent]").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/mi-cuenta/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/mi-cuenta/);
});
