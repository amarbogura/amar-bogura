import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { safeNext } from "@/features/auth/safe-next";
import { DEFAULT_LOCALE, type Locale, localizePath } from "@/i18n/config";
import { auth, type AuthSession } from "@/lib/auth";
import { type AdminRole, can, isAdminRole, type Permission } from "@/lib/permissions";

export type Session = AuthSession;
export type AdminSession = Session & { user: Session["user"] & { role: AdminRole } };

/** Current session (deduplicated per request). */
export const getSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Localized redirect target; `next` stays a locale-free app path (the login page localizes it). */
const withNext = (locale: Locale, path: string, next?: string) =>
  localizePath(locale, next ? `${path}?next=${encodeURIComponent(safeNext(next))}` : path);

// ───────── Pages (redirect) ─────────

export async function requireUser(
  next?: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(withNext(locale, "/login", next));
  return session;
}

/** D-02: a verified phone is required before a user's first request/listing. */
export async function requireVerifiedPhone(
  next?: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Session> {
  const session = await requireUser(next, locale);
  if (!session.user.phoneNumber || !session.user.phoneNumberVerified) {
    redirect(withNext(locale, "/account/verify-phone", next));
  }
  return session;
}

export type AdminCheck =
  | { ok: true; session: AdminSession }
  | {
      ok: false;
      status: 401 | 403;
      reason: "no_session" | "not_admin" | "no_2fa" | "no_permission";
    };

/** Pure authorization decision shared by pages and actions. */
export function checkAdmin(session: Session | null, permission?: Permission): AdminCheck {
  if (!session) return { ok: false, status: 401, reason: "no_session" };
  const { role, twoFactorEnabled, banned } = session.user;
  if (!isAdminRole(role) || banned) return { ok: false, status: 403, reason: "not_admin" };
  if (!twoFactorEnabled) return { ok: false, status: 403, reason: "no_2fa" };
  if (permission && !can(role, permission))
    return { ok: false, status: 403, reason: "no_permission" };
  return { ok: true, session: session as AdminSession };
}

/** For admin pages/layouts: redirects instead of rendering anything to non-admins. */
export async function requireAdminPage(
  permission?: Permission,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AdminSession> {
  const result = checkAdmin(await getSession(), permission);
  if (result.ok) return result.session;
  switch (result.reason) {
    case "no_session":
      redirect(localizePath(locale, "/admin/login"));
    case "no_2fa":
      redirect(localizePath(locale, "/admin/setup-2fa"));
    case "not_admin":
      redirect(localizePath(locale, "/"));
    case "no_permission":
      redirect(localizePath(locale, "/admin?denied=1"));
  }
}

/** For admin Server Actions (authoritative check). */
export async function requireAdmin(permission: Permission): Promise<AdminCheck> {
  return checkAdmin(await getSession(), permission);
}
