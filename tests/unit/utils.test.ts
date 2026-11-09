import { describe, expect, it } from "vitest";
import {
  generateTrackingCode,
  generateOrderCode,
  normalizeCode,
  TRACKING_CODE_REGEX,
} from "@/lib/utils/codes";
import { formatPEN, solesToCents, marginPercent } from "@/lib/utils/money";
import { phonesMatch, normalizePhone } from "@/lib/utils/phone";
import { slugify } from "@/lib/utils/slug";
import { limaLocalToDate, startOfDayLima } from "@/lib/utils/dates";
import { sniffMime } from "@/lib/security/file-validation";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { hasPermission, isStaff } from "@/lib/security/permissions";

describe("códigos de seguimiento", () => {
  it("tienen formato válido y no son secuenciales", () => {
    const codes = new Set(Array.from({ length: 2000 }, generateTrackingCode));
    expect(codes.size).toBe(2000);
    for (const c of codes) expect(c).toMatch(TRACKING_CODE_REGEX);
    expect(generateOrderCode()).toMatch(/^PE-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });
  it("normaliza la entrada del usuario", () => {
    expect(normalizeCode(" ez-ab1o-il00 ")).toBe("EZ-AB10-1100");
  });
});

describe("dinero (PEN)", () => {
  it("convierte y formatea céntimos", () => {
    expect(solesToCents("1234.5")).toBe(123450);
    expect(solesToCents(0.1 + 0.2)).toBe(30);
    expect(formatPEN(123450)).toMatch(/S\/\s?1,234\.50/);
    expect(marginPercent(10000, 7800)).toBe(22);
    expect(marginPercent(10000, null)).toBeNull();
  });
});

describe("teléfonos", () => {
  it("compara ignorando formato y prefijo", () => {
    expect(phonesMatch("+51 955 111 222", "955111222")).toBe(true);
    expect(phonesMatch("955111222", "955111223")).toBe(false);
    expect(phonesMatch("123", "123")).toBe(false);
    expect(normalizePhone("987 654 321")).toBe("51987654321");
  });
});

describe("fechas en America/Lima", () => {
  it("interpreta datetime-local como hora de Lima (UTC-5)", () => {
    expect(limaLocalToDate("2026-11-09T10:00").toISOString()).toBe("2026-11-09T15:00:00.000Z");
  });
  it("calcula el inicio del día en Lima", () => {
    expect(startOfDayLima(new Date("2026-11-10T03:00:00Z")).toISOString()).toBe(
      "2026-11-09T05:00:00.000Z",
    );
  });
});

describe("validación de archivos por magic bytes", () => {
  it("detecta tipos reales e ignora extensiones falsas", () => {
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    expect(sniffMime(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
  });
});

describe("WhatsApp", () => {
  it("no genera enlace sin número configurado (no inventa números)", () => {
    expect(whatsappLink("hola", "")).toBeNull();
  });
  it("codifica el mensaje contextual", () => {
    const l = whatsappLink(whatsappMessages.tracking("EZ-1234-ABCD"), "51 999 888 777");
    expect(l).toBe(
      "https://wa.me/51999888777?text=" +
        encodeURIComponent("Hola, deseo consultar el estado de mi orden EZ-1234-ABCD."),
    );
  });
});

describe("RBAC", () => {
  it("aplica permisos por rol", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("TECHNICIAN", "orders:read")).toBe(false);
    expect(hasPermission("TECHNICIAN", "service-orders:write")).toBe(true);
    expect(hasPermission("TECHNICIAN", "service-orders:read-all")).toBe(false);
    expect(hasPermission("SALES", "users:manage")).toBe(false);
    expect(hasPermission("CUSTOMER", "dashboard:view")).toBe(false);
    expect(isStaff("CUSTOMER")).toBe(false);
  });
});

describe("slug", () => {
  it("genera URLs amigables", () => {
    expect(slugify("Memoria RAM 16 GB — DDR4 ñandú")).toBe("memoria-ram-16-gb-ddr4-nandu");
  });
});
