"use client";

import { useLocale, useT } from "@/i18n/client";

import { tr } from "./schema-utils";
import type { I18n } from "./types";

/** i18n for field components: UI messages (`t`), template text (`tx`) and the page locale. */
export function useFieldI18n() {
  const t = useT();
  const locale = useLocale();
  return { t, locale, tx: (text: Partial<I18n> | undefined) => tr(text, locale) };
}
