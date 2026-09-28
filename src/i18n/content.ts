import type { Locale } from "./config";

type Bilingual<K extends string> = { [P in `${K}Bn` | `${K}En`]?: string | null };

/** `pick(service, "name", "en")` → `nameEn`, falling back to `nameBn` when English is empty. */
export function pick<K extends string>(entity: Bilingual<K>, field: K, locale: Locale): string {
  const record = entity as Record<string, string | null | undefined>;
  const bn = record[`${field}Bn`] ?? "";
  if (locale === "bn") return bn;
  const en = record[`${field}En`];
  return en && en.trim() ? en : bn;
}

/**
 * For legacy columns where the unsuffixed field is Bangla (`description` + `descriptionEn`).
 * English falls back to Bangla so a page never shows an empty section.
 */
export function pickText<V>(bn: V, en: V | null | undefined, locale: Locale): V {
  if (locale === "bn") return bn;
  if (en === null || en === undefined) return bn;
  if (typeof en === "string" && !en.trim()) return bn;
  if (Array.isArray(en) && en.length === 0) return bn;
  return en;
}
