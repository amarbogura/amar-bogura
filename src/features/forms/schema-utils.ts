import type { Locale } from "@/i18n/config";

import type { FormField, FormSchema, I18n } from "./types";

/** All fields of a schema in document order. */
export function allFields(schema: FormSchema): FormField[] {
  return schema.sections.flatMap((section) => section.fields);
}

/** Fields that hold a value (headings are display-only). */
export function valueFields(schema: FormSchema): FormField[] {
  return allFields(schema).filter((field) => field.type !== "heading");
}

/** Template text in `locale`, falling back to the other language when one is missing. */
export const tr = (text: Partial<I18n> | undefined, locale: Locale): string =>
  (locale === "en" ? text?.en || text?.bn : text?.bn || text?.en) ?? "";

/** Bangla text (kept for existing callers). */
export const bn = (text: I18n | undefined): string => text?.bn ?? text?.en ?? "";

/** "Has an answer": not undefined/null/empty string/empty array. `false` IS an answer. */
export function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  return true;
}
