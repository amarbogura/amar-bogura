import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic auth redirect (cookie presence only — never trusted for authorization). The
 * authoritative checks are in layouts (`requireUser` / `requireAdminPage`) and every action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (getSessionCookie(request)) return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
