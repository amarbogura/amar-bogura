import type { Metadata } from "next";

import { LOCALES, type Locale, localizePath, OG_LOCALE } from "./config";

/**
 * hreflang + canonical for a public path (`/services/x`): canonical is the page's own language,
 * alternates list both, `x-default` is Bangla.
 */
export function localeAlternates(
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localizePath(locale, path),
    languages: {
      ...Object.fromEntries(
        LOCALES.map((l) => [l === "bn" ? "bn-BD" : "en", localizePath(l, path)]),
      ),
      "x-default": localizePath("bn", path),
    },
  };
}

export function ogLocale(locale: Locale): Pick<NonNullable<Metadata["openGraph"]>, "locale"> & {
  alternateLocale: string[];
} {
  return {
    locale: OG_LOCALE[locale],
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
  };
}
