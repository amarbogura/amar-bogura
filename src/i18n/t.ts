// Translators usable anywhere on the server side (pure: no request APIs, no "server-only").
import type { Locale } from "./config";
import { MESSAGES, type Messages } from "./messages";
import { createTranslator, type Translator } from "./translate";

export type T = Translator<Messages>;

const translators = new Map<Locale, T>();

/** Translator for a locale (pages/layouts get `locale` from `params`). */
export function getT(locale: Locale): T {
  let t = translators.get(locale);
  if (!t) {
    t = createTranslator(MESSAGES[locale], locale);
    translators.set(locale, t);
  }
  return t;
}
