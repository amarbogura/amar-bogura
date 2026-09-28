"use client";

import { Search } from "lucide-react";

import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import type { MessageKey } from "@/i18n/translate";
import { routes } from "@/lib/routes";

import { AccountButton } from "./account-button";
import { LanguageSwitcher } from "./language-switcher";

const DESKTOP_NAV: Array<{ href: string; label: MessageKey<Messages> }> = [
  { href: routes.home, label: "common.home" },
  { href: "/#services", label: "nav.services" },
  { href: routes.buySell, label: "nav.buySell" },
  { href: routes.property, label: "nav.property" },
  { href: routes.customRequest, label: "nav.customRequest" },
];

export function SiteHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4">
        <Link
          href={routes.home}
          className="flex min-w-0 items-center gap-2 font-bold"
          aria-label={t("nav.homeLink")}
        >
          <LogoMark />
          <span className="truncate text-base sm:text-lg">{t("common.siteName")}</span>
        </Link>

        <nav aria-label={t("nav.main")} className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {DESKTOP_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex tap items-center rounded-md px-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <LanguageSwitcher variant="header" />
          <Link
            href={routes.search()}
            aria-label={t("common.search")}
            className="inline-flex tap items-center justify-center rounded-full hover:bg-white/10"
          >
            <Search className="size-6" aria-hidden="true" />
          </Link>
          <AccountButton />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <path
        d="M32 12c-8.3 0-15 6.5-15 14.6C17 38 32 52 32 52s15-14 15-25.4C47 18.5 40.3 12 32 12Z"
        fill="#166534"
      />
      <circle cx="32" cy="27" r="6" fill="#c2410c" />
    </svg>
  );
}
