"use client";

import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  PhoneCall,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { useLocale, useT } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { toLocaleDigits } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import type { MessageKey } from "@/i18n/translate";
import { cn } from "@/lib/utils";

export type AdminNavKey = "overview" | "requests" | "newRequest" | "users" | "audit";

const NAV: Record<AdminNavKey, { href: string; icon: LucideIcon; label: MessageKey<Messages> }> = {
  overview: { href: "/admin", icon: LayoutDashboard, label: "admin.nav.overview" },
  requests: { href: "/admin/requests", icon: ClipboardList, label: "admin.nav.requests" },
  newRequest: { href: "/admin/requests/new", icon: PhoneCall, label: "admin.nav.newRequest" },
  users: { href: "/admin/users", icon: Users, label: "admin.nav.users" },
  audit: { href: "/admin/audit", icon: ScrollText, label: "admin.nav.audit" },
};

function isActive(key: AdminNavKey, path: string) {
  const href = NAV[key].href;
  if (key === "overview") return path === href;
  if (key === "requests") return path.startsWith(href) && !path.startsWith(NAV.newRequest.href);
  return path === href || path.startsWith(`${href}/`);
}

function NavList({
  items,
  newCount,
  onNavigate,
}: {
  items: AdminNavKey[];
  newCount: number;
  onNavigate?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const path = stripLocale(usePathname());
  return (
    <ul className="flex flex-col gap-1">
      {items.map((key) => {
        const { href, icon: Icon, label } = NAV[key];
        const active = isActive(key, path);
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex tap items-center gap-3 rounded-lg px-3 text-sm font-medium",
                active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t(label)}</span>
              {key === "requests" && newCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    active ? "bg-white/20" : "bg-cta text-cta-foreground",
                  )}
                >
                  {toLocaleDigits(newCount, locale)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
      <li className="mt-2 border-t pt-2">
        <Link
          href="/"
          className="flex tap items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          <ExternalLink className="size-5" aria-hidden="true" />
          {t("admin.nav.site")}
        </Link>
      </li>
    </ul>
  );
}

/**
 * Admin chrome: sidebar on desktop, a drawer on mobile. The menu items come from the server
 * (built from the admin's permissions), so a hidden item is never a security boundary — every page
 * and action still checks permissions itself.
 */
export function AdminShell({
  items,
  newCount,
  userLabel,
  children,
}: {
  items: AdminNavKey[];
  newCount: number;
  userLabel: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    openRef.current?.focus();
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-navy px-3 py-2 text-navy-foreground md:px-4">
        <button
          ref={openRef}
          type="button"
          className="inline-flex tap items-center justify-center rounded-md hover:bg-white/10 md:hidden"
          aria-label={t("admin.nav.open")}
          aria-expanded={open}
          aria-controls="admin-drawer"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
        <p className="flex min-w-0 items-center gap-2 font-semibold">
          <Logo alt={t("common.siteName")} className="h-9" />
          <span className="truncate">{t("admin.title")}</span>
        </p>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden max-w-48 truncate sm:inline">{userLabel}</span>
          <LanguageSwitcher variant="header" />
          <SignOutButton
            redirectTo="/admin/login"
            className="border-white/40 bg-transparent text-navy-foreground hover:bg-white/10 hover:text-navy-foreground"
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <nav
          aria-label={t("admin.nav.menu")}
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r p-3 md:block"
        >
          <NavList items={items} newCount={newCount} />
        </nav>
        <main className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-6">{children}</main>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          id="admin-drawer"
          aria-label={t("admin.nav.menu")}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("admin.nav.close")}
            tabIndex={-1}
            onClick={close}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-3 bg-background p-3 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="px-2 font-semibold">{userLabel}</p>
              <button
                ref={closeRef}
                type="button"
                className="inline-flex tap items-center justify-center rounded-md hover:bg-muted"
                aria-label={t("admin.nav.close")}
                onClick={close}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label={t("admin.nav.menu")}>
              <NavList items={items} newCount={newCount} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
