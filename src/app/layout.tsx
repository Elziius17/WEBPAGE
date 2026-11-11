import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { siteConfig } from "@/config/site";
import { CookieConsent } from "@/components/layout/cookie-consent";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Soporte técnico, hardware y desarrollo web en Perú`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "servicio técnico de computadoras",
    "mantenimiento de laptops",
    "repotenciación de PC",
    "componentes de computadora Perú",
    "desarrollo de páginas web",
    "soporte técnico empresas",
  ],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/logo/elziius-logo-original.jpg", width: 1408, height: 768, alt: "ELZIIUS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B223F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
