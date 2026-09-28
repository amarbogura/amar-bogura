"use client";

import { Search } from "lucide-react";

import { useLocale, useT } from "@/i18n/client";
import { localizePath } from "@/i18n/config";
import { routes } from "@/lib/routes";

/** Hero with a plain GET search form — works before any JavaScript loads (LCP is this text). */
export function Hero() {
  const t = useT();
  const locale = useLocale();
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-gradient-to-b from-primary to-[oklch(0.4_0.1_155)] px-4 pt-8 pb-10 text-primary-foreground md:pt-14 md:pb-16"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 id="hero-title" className="text-2xl leading-snug font-bold text-white md:text-4xl">
          {t("home.heroTitle")}
        </h1>
        <p className="text-sm text-white/85 md:text-base">{t("home.heroText")}</p>
        <form
          action={localizePath(locale, routes.search())}
          method="get"
          role="search"
          className="mx-auto flex w-full max-w-xl gap-2"
        >
          <label htmlFor="hero-search" className="sr-only">
            {t("home.searchLabel")}
          </label>
          <input
            id="hero-search"
            name="q"
            type="search"
            placeholder={t("home.searchPlaceholder")}
            className="h-12 min-w-0 flex-1 rounded-xl border-0 bg-white px-4 text-base text-foreground shadow-md outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-cta/60"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-cta px-4 font-semibold text-cta-foreground shadow-md hover:bg-cta/90 focus-visible:ring-[3px] focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <Search className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("common.search")}</span>
            <span className="sr-only sm:hidden">{t("common.search")}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
