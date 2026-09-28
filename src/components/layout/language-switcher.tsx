"use client";

import { Languages } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useLocale, useT } from "@/i18n/client";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale, localizePath } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface SwitcherProps {
  variant: "header" | "footer";
  className?: string;
}

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

function SwitchLink({ href, className, variant }: SwitcherProps & { href: string }) {
  const locale = useLocale();
  const t = useT();
  const target: Locale = locale === "bn" ? "en" : "bn";
  return (
    // A full page load (not client routing): the other language has its own root layout + messages.
    <a
      href={href}
      hrefLang={target === "bn" ? "bn-BD" : "en"}
      lang={target}
      aria-label={t("language.switchTo")}
      onClick={(event) => {
        rememberLocale(target);
        // Always the current page, even if the URL-aware link hasn't streamed in yet.
        event.preventDefault();
        const { pathname, search, hash } = window.location;
        window.location.assign(localizePath(target, pathname) + search + hash);
      }}
      className={cn(
        "inline-flex tap items-center justify-center gap-1.5 rounded-md font-semibold",
        variant === "header"
          ? "min-w-11 border border-white/40 px-2 text-sm text-white hover:bg-white/10 sm:px-2.5"
          : "text-sm underline-offset-4 hover:underline",
        className,
      )}
    >
      {variant === "header" ? (
        <>
          <Languages className="hidden size-4 sm:inline" aria-hidden="true" />
          {t("language.short")}
        </>
      ) : (
        t("language.footer")
      )}
    </a>
  );
}

function SwitcherWithUrl(props: SwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const href = localizePath(locale === "bn" ? "en" : "bn", pathname) + (query ? `?${query}` : "");
  return <SwitchLink {...props} href={href} />;
}

/**
 * Bangla ⇄ English (D-17): opens the SAME page in the other language and remembers the choice in
 * the `ab_locale` cookie. It reads the URL, so it renders inside Suspense (fallback: the other
 * language's home page).
 */
export function LanguageSwitcher(props: SwitcherProps) {
  const locale = useLocale();
  const fallback = localizePath(locale === "bn" ? "en" : "bn", "/");
  return (
    <Suspense fallback={<SwitchLink {...props} href={fallback} />}>
      <SwitcherWithUrl {...props} />
    </Suspense>
  );
}
