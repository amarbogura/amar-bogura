"use client";

import {
  ClipboardList,
  House,
  type LucideIcon,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { useT } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import type { MessageKey } from "@/i18n/translate";
import type { Messages } from "@/i18n/messages";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Tab {
  label: MessageKey<Messages>;
  href: string;
  icon: LucideIcon;
  /** Paths (prefixes) that mark this tab as current. */
  match: string[];
}

/** docs/01 §4: Home, Search, Requests, Buy & Sell, Profile. "Requests" = my requests (guest: track). */
export function bottomNavTabs(loggedIn: boolean): Tab[] {
  return [
    { label: "common.home", href: routes.home, icon: House, match: ["/"] },
    { label: "common.search", href: routes.search(), icon: Search, match: ["/search"] },
    {
      label: "nav.requests",
      href: loggedIn ? routes.myRequests : routes.track,
      icon: ClipboardList,
      match: [routes.myRequests, routes.track, routes.customRequest],
    },
    { label: "nav.buySellShort", href: routes.buySell, icon: ShoppingBag, match: [routes.buySell] },
    {
      label: "nav.profile",
      href: loggedIn ? routes.account : routes.login,
      icon: UserRound,
      match: [routes.account, routes.login],
    },
  ];
}

/** `pathname` is the browser URL; the `/en` prefix is ignored. */
export function isTabActive(tab: Pick<Tab, "match">, url: string): boolean {
  const pathname = stripLocale(url);
  return tab.match.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Reads the URL, so the layout renders it inside <Suspense> (Cache Components). */
export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

/** Suspense fallback: same bar, no active tab (no layout shift while the URL streams in). */
export function BottomNavFallback() {
  return <BottomNavView pathname="" />;
}

function BottomNavView({ pathname }: { pathname: string }) {
  const { data } = authClient.useSession();
  const t = useT();
  // "My requests" is more specific than "profile" under /account.
  const tabs = bottomNavTabs(!!data);
  const activeIndex = tabs.findIndex((tab) => isTabActive(tab, pathname));

  return (
    <nav
      aria-label={t("nav.bottom")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 safe-bottom backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab, index) => {
          const active = index === activeIndex;
          const TabIcon = tab.icon;
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TabIcon className={cn("size-6", active && "stroke-[2.5]")} aria-hidden="true" />
                {t(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
