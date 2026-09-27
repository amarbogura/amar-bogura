import { Search } from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";

import { AccountButton } from "./account-button";

const DESKTOP_NAV = [
  { href: routes.home, label: "হোম" },
  { href: "/#services", label: "সার্ভিস" },
  { href: routes.buySell, label: "বাই অ্যান্ড সেল" },
  { href: routes.property, label: "প্রপার্টি" },
  { href: routes.customRequest, label: "কাস্টম রিকোয়েস্ট" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href={routes.home}
          className="flex items-center gap-2 font-bold"
          aria-label="আমার বগুড়া — হোম"
        >
          <LogoMark />
          <span className="text-lg">আমার বগুড়া</span>
        </Link>

        <nav aria-label="প্রধান মেনু" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {DESKTOP_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex tap items-center rounded-md px-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={routes.search()}
            aria-label="খুঁজুন"
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
    <svg viewBox="0 0 64 64" className="size-8" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <path
        d="M32 12c-8.3 0-15 6.5-15 14.6C17 38 32 52 32 52s15-14 15-25.4C47 18.5 40.3 12 32 12Z"
        fill="#166534"
      />
      <circle cx="32" cy="27" r="6" fill="#c2410c" />
    </svg>
  );
}
