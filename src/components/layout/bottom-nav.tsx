"use client";

import {
  ClipboardList,
  House,
  type LucideIcon,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Paths (prefixes) that mark this tab as current. */
  match: string[];
}

/** docs/01 §4: হোম, খুঁজুন, রিকোয়েস্ট, Buy & Sell, প্রোফাইল. "রিকোয়েস্ট" = my requests (guest: track). */
export function bottomNavTabs(loggedIn: boolean): Tab[] {
  return [
    { label: "হোম", href: routes.home, icon: House, match: ["/"] },
    { label: "খুঁজুন", href: routes.search(), icon: Search, match: ["/search"] },
    {
      label: "রিকোয়েস্ট",
      href: loggedIn ? routes.myRequests : routes.track,
      icon: ClipboardList,
      match: [routes.myRequests, routes.track, routes.customRequest],
    },
    { label: "Buy & Sell", href: routes.buySell, icon: ShoppingBag, match: [routes.buySell] },
    {
      label: "প্রোফাইল",
      href: loggedIn ? routes.account : routes.login,
      icon: UserRound,
      match: [routes.account, routes.login],
    },
  ];
}

export function isTabActive(tab: Pick<Tab, "match">, pathname: string): boolean {
  return tab.match.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { data } = authClient.useSession();
  // "My requests" is more specific than "profile" under /account.
  const tabs = bottomNavTabs(!!data);
  const activeIndex = tabs.findIndex((tab) => isTabActive(tab, pathname));

  return (
    <nav
      aria-label="নিচের মেনু"
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
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
