import "server-only";

import { headers } from "next/headers";

import { DEFAULT_LOCALE, isLocale, type Locale, localeFromPath } from "./config";
import { MESSAGES, type Messages } from "./messages";
import { getT, type T } from "./t";

export { getT, type T };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/** `params.locale` → Locale (anything unexpected falls back to Bangla). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

/**
 * Locale of the page that sent a Server Action / auth request: its URL is in `Referer` (same-origin
 * requests always carry the full URL under our `strict-origin-when-cross-origin` policy).
 * Presentation only — never used for authorization.
 */
export async function getRequestLocale(): Promise<Locale> {
  const referer = (await headers()).get("referer");
  if (!referer) return DEFAULT_LOCALE;
  try {
    return localeFromPath(new URL(referer).pathname);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Translator for the current Server Action / route handler request. */
export async function getRequestT(): Promise<T> {
  return getT(await getRequestLocale());
}
