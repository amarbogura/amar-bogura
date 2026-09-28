import { Suspense } from "react";

import { BottomNav, BottomNavFallback } from "@/components/layout/bottom-nav";
import { EmergencyChip } from "@/components/layout/emergency-chip";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteSettings } from "@/features/site/queries";
import { getT, resolveLocale } from "@/i18n/server";

/** Public shell: header, content, footer; on mobile also the bottom nav and emergency chip. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const [settings, locale] = await Promise.all([getSiteSettings(), resolveLocale(params)]);
  const t = getT(locale);
  return (
    <div className="flex flex-1 flex-col pb-nav md:pb-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("common.skipToContent")}
      </a>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter hotline={settings.hotline} />
      {/* Both read the URL: inside Suspense so pages with runtime params (request codes) still
          prerender their shell. */}
      {settings.emergencyChipEnabled && (
        <Suspense fallback={null}>
          <EmergencyChip ambulancePhone={settings.ambulancePhone} />
        </Suspense>
      )}
      <Suspense fallback={<BottomNavFallback />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
