import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BusinessProvider } from "@/components/layout/business-context";
import { WhatsAppFloating } from "@/components/layout/whatsapp-button";
import { getPublicBusinessInfo } from "@/services/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [business, user] = await Promise.all([getPublicBusinessInfo(), getCurrentUser()]);
  return (
    <BusinessProvider value={business}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-brand-cyan focus:px-4 focus:py-2 focus:text-ink-950">
        Saltar al contenido
      </a>
      <SiteHeader account={user ? { name: user.name, isStaff: isStaff(user.role) } : null} />
      <main id="contenido" className="flex-1">{children}</main>
      <SiteFooter business={business} />
      <WhatsAppFloating />
    </BusinessProvider>
  );
}
