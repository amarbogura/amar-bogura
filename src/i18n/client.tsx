"use client";

import { createContext, useContext, useMemo } from "react";

import { DEFAULT_LOCALE, type Locale } from "./config";
import type { Messages } from "./messages";
import { createTranslator, type Translator } from "./translate";

interface I18nValue {
  locale: Locale;
  t: Translator<Messages>;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Root of every page: only the active locale's messages are sent to the browser. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, t: createTranslator(messages, locale) }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useT()/useLocale() must be used inside <I18nProvider>");
  return value;
}

export function useT(): Translator<Messages> {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
}
