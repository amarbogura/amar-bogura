import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import type { Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Session guard runs inside Suspense (Cache Components: request data can't block the shell). */
async function AccountGate({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  await requireUser("/account", locale);
  return children;
}

export default async function AccountLayout({
  children,
  params,
}: LayoutProps<"/[locale]/account">) {
  const locale = await resolveLocale(params);
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <AccountGate locale={locale}>{children}</AccountGate>
      </Suspense>
    </div>
  );
}
