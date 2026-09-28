"use client";

import { adminClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { Messages } from "@/i18n/messages";
import type { Translator } from "@/i18n/translate";
import { ac, authRoles } from "@/lib/access-control";

export const authClient = createAuthClient({
  plugins: [
    phoneNumberClient(),
    // The admin login form handles `twoFactorRedirect` itself (TOTP step), so no global redirect.
    twoFactorClient(),
    adminClient({ ac, roles: authRoles }),
  ],
});

/** Better Auth error codes users can hit → a message in the page's language. */
export function authErrorMessage(
  error: { code?: string; status?: number; message?: string },
  t: Translator<Messages>,
): string {
  if (error.status === 429) return t("auth.errors.tooMany");
  switch (error.code) {
    case "INVALID_OTP":
      return t("auth.errors.invalidOtp");
    case "OTP_EXPIRED":
    case "OTP_NOT_FOUND":
      return t("auth.errors.otpExpired");
    case "TOO_MANY_ATTEMPTS":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return t("auth.errors.tooManyAttempts");
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return t("auth.errors.locked");
    case "INVALID_PHONE_NUMBER":
      return t("auth.phoneInvalid");
    case "PHONE_NUMBER_EXIST":
      return t("auth.errors.phoneExists");
    case "INVALID_EMAIL_OR_PASSWORD":
      return t("auth.errors.badCredentials");
    case "INVALID_CODE":
    case "INVALID_BACKUP_CODE":
    case "INVALID_TWO_FACTOR_COOKIE":
      return t("auth.errors.invalidTotp");
    case "BANNED_USER":
      return t("auth.errors.banned");
    // Our own server-side errors (src/lib/auth.ts).
    case "ADMIN_LOGIN_REQUIRED":
      return t("auth.errors.adminOnlyPage");
    case "ENDPOINT_DISABLED":
      return t("auth.errors.notAllowedHere");
    default:
      return error.status === 403 ? t("auth.errors.forbiddenRefresh") : t("auth.errors.generic");
  }
}
