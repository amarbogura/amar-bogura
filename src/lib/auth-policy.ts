// Pure auth policy used by Better Auth hooks (src/lib/auth.ts). No I/O — unit-tested directly.
import { isAdminRole } from "@/lib/permissions";

/**
 * The only endpoints allowed to create a session for an admin-role user. Phone OTP
 * (/phone-number/verify) and OAuth callbacks skip the twoFactor plugin, so admins must never get a
 * session from them (D-04: admins = email + password + TOTP).
 */
export const ADMIN_SESSION_PATHS = [
  "/sign-in/email",
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
] as const;

export function canCreateSession(role: unknown, path: string | undefined): boolean {
  if (!isAdminRole(role)) return true;
  return path !== undefined && (ADMIN_SESSION_PATHS as readonly string[]).includes(path);
}

/**
 * Better Auth endpoints we disable. `/update-user` would let a user rewrite `phoneNumber` (the
 * phone-number plugin leaves it writable) while keeping `phoneNumberVerified`, and would bypass our
 * Zod-validated profile action. Phone changes go through OTP; profile edits through `updateProfile`.
 */
export const BLOCKED_AUTH_PATHS = ["/update-user", "/change-email"] as const;

export function isBlockedAuthPath(path: string): boolean {
  return (BLOCKED_AUTH_PATHS as readonly string[]).includes(path);
}

export type RateLimitPolicy =
  "otpSendPhone" | "otpSendIp" | "otpVerifyIp" | "adminLogin" | "twoFactorVerify";

export interface RateLimitCheck {
  policy: RateLimitPolicy;
  key: string;
}

const bodyString = (body: unknown, field: string): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
};

/** Which rate limits apply to a Better Auth endpoint call (checked in a `hooks.before`). */
export function rateLimitChecksFor(path: string, body: unknown, ip: string): RateLimitCheck[] {
  switch (path) {
    case "/phone-number/send-otp": {
      const phone = bodyString(body, "phoneNumber");
      return [
        ...(phone ? [{ policy: "otpSendPhone" as const, key: phone }] : []),
        { policy: "otpSendIp", key: ip },
      ];
    }
    case "/phone-number/verify":
      return [{ policy: "otpVerifyIp", key: ip }];
    case "/sign-in/email": {
      const email = bodyString(body, "email");
      return [
        { policy: "adminLogin", key: ip },
        ...(email ? [{ policy: "adminLogin" as const, key: `email:${email}` }] : []),
      ];
    }
    case "/two-factor/verify-totp":
    case "/two-factor/verify-backup-code":
      return [{ policy: "twoFactorVerify", key: ip }];
    default:
      return [];
  }
}

// Phone sign-up (D-02) needs an email for Better Auth; we use a non-routable placeholder.
const TEMP_EMAIL_DOMAIN = "phone.amarbogura.invalid";

export function tempEmailForPhone(e164: string): string {
  return `${e164.replace(/\D/g, "")}@${TEMP_EMAIL_DOMAIN}`;
}

export function isTempEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${TEMP_EMAIL_DOMAIN}`);
}

/** New phone users are created with their phone number as name until they enter a real one. */
export function isTempName(name: string | null | undefined, phoneNumber?: string | null): boolean {
  if (!name) return true;
  return name === phoneNumber || /^\+?\d{10,15}$/.test(name);
}

/**
 * Origins allowed to call /api/auth (Better Auth answers 403 INVALID_ORIGIN to anything else).
 * The site URLs are trusted with their www / apex twin, so both https://example.com and
 * https://www.example.com work; `extra` is a comma-separated list (e.g. a Vercel preview URL).
 */
export function authTrustedOrigins(siteUrls: Array<string | undefined>, extra?: string): string[] {
  const origins = new Set<string>();
  for (const url of siteUrls) {
    // Missing/invalid values are skipped (env validation already guards real deployments).
    if (!url || !URL.canParse(url)) continue;
    const { protocol, host, origin } = new URL(url);
    origins.add(origin);
    if (host.startsWith("localhost") || /^[\d.:[\]]+$/.test(host)) continue;
    const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    origins.add(`${protocol}//${twin}`);
  }
  for (const value of extra?.split(",") ?? []) {
    const trimmed = value.trim().replace(/\/+$/, "");
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
}
