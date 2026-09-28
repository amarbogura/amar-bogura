import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { LOCALE_COOKIE, localizePath, stripLocale } from "@/i18n/config";

/** Paths that need a session (optimistic check only — never trusted for authorization). */
function needsSession(path: string): "user" | "admin" | null {
  if (path === "/account" || path.startsWith("/account/")) return "user";
  if (path === "/admin/login") return null;
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  return null;
}

/**
 * 1. Language (D-17): Bangla lives at `/…` (rewritten to the internal `/bn/…` segment), English at
 *    `/en/…`. A public `/bn/…` URL 308s to the unprefixed one so each page has one URL per language.
 *    A remembered English choice (`ab_locale=en`) sends `/…` to `/en/…`.
 * 2. Optimistic auth redirect (cookie presence only). The authoritative checks are in layouts
 *    (`requireUser` / `requireAdminPage`) and every action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    return NextResponse.redirect(new URL(`${stripLocale(pathname)}${search}`, request.url), 308);
  }

  const english = pathname === "/en" || pathname.startsWith("/en/");
  const path = english ? stripLocale(pathname) : pathname;
  const locale = english ? "en" : "bn";

  if (!english && request.method === "GET" && request.cookies.get(LOCALE_COOKIE)?.value === "en") {
    return NextResponse.redirect(new URL(`${localizePath("en", pathname)}${search}`, request.url));
  }

  const guard = needsSession(path);
  if (guard && !getSessionCookie(request)) {
    if (guard === "admin") {
      return NextResponse.redirect(new URL(localizePath(locale, "/admin/login"), request.url));
    }
    const login = new URL(localizePath(locale, "/login"), request.url);
    login.searchParams.set("next", `${path}${search}`);
    return NextResponse.redirect(login);
  }

  if (english) return NextResponse.next();
  return NextResponse.rewrite(
    new URL(`/bn${pathname === "/" ? "" : pathname}${search}`, request.url),
  );
}

export const config = {
  // Every page; not API routes, Next internals or files (icon.svg, robots.txt, sitemap.xml…).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
