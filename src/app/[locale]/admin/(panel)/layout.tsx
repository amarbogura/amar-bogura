import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { AdminShell, type AdminNavKey } from "@/features/admin/components/admin-shell";
import { countNewRequests } from "@/features/admin/requests/queries";
import type { Locale } from "@/i18n/config";
import { getT, resolveLocale } from "@/i18n/server";
import { can } from "@/lib/permissions";
import { requireAdminPage } from "@/lib/session";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]/admin">): Promise<Metadata> {
  const t = getT(await resolveLocale(params));
  return {
    title: { default: t("admin.title"), template: t("admin.titleTemplate") },
    robots: { index: false, follow: false },
  };
}

/** Authoritative guard for the whole admin panel; renders chrome + children only for admins. */
async function AdminGate({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = getT(locale);
  const { user } = await requireAdminPage(undefined, locale);
  const items: AdminNavKey[] = ["overview"];
  if (can(user.role, "requests.manage")) items.push("requests", "newRequest");
  if (can(user.role, "users.manage")) items.push("users");
  if (can(user.role, "audit.view")) items.push("audit");
  const newCount = can(user.role, "requests.manage") ? await countNewRequests() : 0;
  return (
    <AdminShell
      items={items}
      newCount={newCount}
      userLabel={`${user.name} · ${t(`roles.${user.role}`)}`}
    >
      {children}
    </AdminShell>
  );
}

export default async function AdminPanelLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  return (
    <Suspense fallback={<PageSkeleton label={getT(locale)("admin.loading")} />}>
      <AdminGate locale={locale}>{children}</AdminGate>
    </Suspense>
  );
}
