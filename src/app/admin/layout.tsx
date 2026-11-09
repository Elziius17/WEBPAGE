import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SignOutButton } from "@/components/forms/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, isStaff } from "@/lib/security/permissions";
import { adminNav } from "@/config/admin-nav";
import { roleLabel } from "@/config/statuses";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel ELZIIUS" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/mi-cuenta");
  const nav = adminNav
    .map((g) => ({ ...g, items: g.items.filter((i) => hasPermission(user.role, i.permission)) }))
    .filter((g) => g.items.length);
  return (
    <div className="min-h-dvh bg-ink-950">
      <AdminSidebar
        nav={nav}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{user.name}</p>
              <p className="text-xs text-fg-subtle">{roleLabel[user.role]}</p>
            </div>
            <SignOutButton />
          </div>
        }
      />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
