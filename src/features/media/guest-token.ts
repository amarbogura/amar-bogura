import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Anonymous guest identity for uploads (D-03). Cookie value = `{id}.{hmac(id)}`; the DB only ever
 * stores `guestKeyFor(id)` (a hash), so a leaked row can't be turned back into a cookie.
 */
export const GUEST_COOKIE = "ab_guest";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const mac = (id: string, secret: string) =>
  createHmac("sha256", secret).update(`guest:${id}`).digest("base64url");

export function newGuestId(): string {
  return randomBytes(18).toString("base64url");
}

export function signGuestId(id: string, secret: string): string {
  return `${id}.${mac(id, secret)}`;
}

/** Returns the guest id for a genuine cookie value, or null if missing/tampered. */
export function verifyGuestCookie(value: string | undefined, secret: string): string | null {
  if (!value) return null;
  const [id, signature, extra] = value.split(".");
  if (!id || !signature || extra !== undefined || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) return null;
  const expected = Buffer.from(mac(id, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

/** Hash stored on MediaAsset.guestKey and used in the public_id (path-safe, 24 chars). */
export function guestKeyFor(id: string): string {
  return createHash("sha256")
    .update(`guest-key:${id}`)
    .digest("base64url")
    .slice(0, 24)
    .replace(/-/g, "_");
}
