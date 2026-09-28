/**
 * Bilingual site (D-17): Bangla at `/…` (default, no prefix), English at `/en/…`. The proxy rewrites
 * unprefixed paths to the internal `/bn/…` segment, so every public page lives under `[locale]`.
 */
export const LOCALES = ["bn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "bn";

/** Remembers an explicit switch (proxy redirects `/x` → `/en/x`; admin reads it directly). */
export const LOCALE_COOKIE = "ab_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Locale of a public URL path (`/en/…` → en, everything else → bn). */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "bn";
}

/** Removes a leading `/en` or `/bn` segment: `/en/services/x` → `/services/x`, `/en` → `/`. */
export function stripLocale(pathname: string): string {
  const match = /^\/(en|bn)(?=\/|$|\?|#)/.exec(pathname);
  if (!match) return pathname;
  const rest = pathname.slice(match[0].length);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest;
}

/**
 * The public URL of an app path in `locale`. Bangla stays unprefixed; English gets `/en`.
 * External URLs, `tel:`/`mailto:`, hash-only links and API paths are returned unchanged.
 */
export function localizePath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (path === "/api" || path.startsWith("/api/")) return path;
  const bare = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return bare;
  if (bare === "/") return "/en";
  if (bare.startsWith("/?") || bare.startsWith("/#")) return `/en${bare.slice(1)}`;
  return `/en${bare}`;
}

/** Intl locale tags: numbers use South Asian (lakh) grouping in both languages. */
export const INTL_NUMBER_LOCALE: Record<Locale, string> = { bn: "bn-BD", en: "en-IN" };
export const INTL_DATE_LOCALE: Record<Locale, string> = { bn: "bn-BD", en: "en-BD" };

/** `og:locale` values. */
export const OG_LOCALE: Record<Locale, string> = { bn: "bn_BD", en: "en_US" };
