import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { notFound } from "next/navigation";

import { env } from "@/env";
import { I18nProvider } from "@/i18n/client";
import { isLocale, LOCALES } from "@/i18n/config";
import { getMessages, getT } from "@/i18n/server";

import "../globals.css";

const bangla = Noto_Sans_Bengali({
  variable: "--font-bangla",
  // Bengali + Latin (English pages); both subsets come from the same family.
  subsets: ["bengali", "latin"],
  // "optional": no late swap repaint (it was the LCP on 4G). Android ships Noto Sans Bengali as its
  // system Bangla font, so the fallback is visually the same for most users.
  display: "optional",
  // Not preloaded: keeps the font off the critical path. First visits on slow networks use the
  // system font; the file is cached in the background for every later page.
  preload: false,
});

/** Both languages are prerendered (D-17): `/` → bn (rewritten by the proxy), `/en` → en. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = getT(isLocale(locale) ? locale : "bn");
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: t("meta.defaultTitle"), template: t("meta.titleTemplate") },
    description: t("meta.description"),
    applicationName: t("common.siteName"),
  };
}

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} className={`${bangla.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
