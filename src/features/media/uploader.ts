import "server-only";

import { cookies } from "next/headers";

import { env } from "@/env";
import { getRequestT } from "@/i18n/server";
import type { MediaPurpose } from "@/generated/prisma/enums";
import { can, isAdminRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";

import { type Uploader, uploadPermission } from "./config";
import {
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE,
  guestKeyFor,
  newGuestId,
  signGuestId,
  verifyGuestCookie,
} from "./guest-token";

export type UploaderResult =
  { ok: true; uploader: Uploader } | { ok: false; status: 401 | 403; error: string };

/** Current guest key from the signed cookie, or null (never creates one). */
export async function currentGuestKey(): Promise<string | null> {
  const id = verifyGuestCookie((await cookies()).get(GUEST_COOKIE)?.value, env.BETTER_AUTH_SECRET);
  return id ? guestKeyFor(id) : null;
}

/**
 * Who is uploading for this purpose. `createGuest` (sign route only) issues the guest cookie on a
 * guest's first upload; registerMedia/claim never create one.
 */
export async function resolveUploader(
  purpose: MediaPurpose,
  { createGuest = false }: { createGuest?: boolean } = {},
): Promise<UploaderResult> {
  const [session, t] = await Promise.all([getSession(), getRequestT()]);
  if (session) {
    const { role, twoFactorEnabled, banned } = session.user;
    if (banned) return { ok: false, status: 403, error: t("errors.403") };
    const isAdmin = isAdminRole(role) && twoFactorEnabled && can(role, "cms.manage");
    const permission = uploadPermission(purpose, isAdmin ? "admin" : "user");
    if (permission !== "ok") return { ok: false, status: 403, error: t("errors.403") };
    return { ok: true, uploader: { kind: "user", id: session.user.id } };
  }

  if (uploadPermission(purpose, "guest") !== "ok") {
    return { ok: false, status: 401, error: t("media.loginToUpload") };
  }

  const existing = await currentGuestKey();
  if (existing) return { ok: true, uploader: { kind: "guest", key: existing } };
  if (!createGuest) return { ok: false, status: 401, error: t("errors.tryAgain") };

  const id = newGuestId();
  (await cookies()).set(GUEST_COOKIE, signGuestId(id, env.BETTER_AUTH_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return { ok: true, uploader: { kind: "guest", key: guestKeyFor(id) } };
}
