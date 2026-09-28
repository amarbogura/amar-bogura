// Test helper: render inside the same I18nProvider the [locale] layout uses (default Bangla).
import { render, type RenderOptions } from "@testing-library/react";

import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";

export function renderWithI18n(
  ui: React.ReactElement,
  { locale = "bn", ...options }: RenderOptions & { locale?: Locale } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <I18nProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </I18nProvider>
    ),
    ...options,
  });
}
