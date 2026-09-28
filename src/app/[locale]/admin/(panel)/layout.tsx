import type { Metadata } from "next";
import { Suspense } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PageSkeleton } from "@/components/skeletons";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { Locale } from "@/i18n/config";
import { getT, resolveLocale } from "@/i18n/server";
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
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-navy px-4 py-3 text-navy-foreground">
        <p className="font-semibold">{t("admin.brand")}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            {user.name} · {t(`roles.${user.role}`)}
          </span>
          <LanguageSwitcher variant="header" />
          <SignOutButton redirectTo="/admin/login" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        {children}
      </main>
    </>
  );
}

export default async function AdminPanelLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<PageSkeleton label={getT(locale)("admin.loading")} />}>
        <AdminGate locale={locale}>{children}</AdminGate>
      </Suspense>
    </div>
  );
}
