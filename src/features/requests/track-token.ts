import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * `/track` access (D-03): after the OTP to the request's phone is verified, this httpOnly cookie
 * lets the browser read that ONE request for 30 minutes. Value = `{requestId}.{exp}.{hmac}`.
 */
export const TRACK_COOKIE = "ab_track";
export const TRACK_TTL_SECONDS = 30 * 60;

const mac = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`track:${payload}`).digest("base64url");

export function signTrackToken(requestId: string, secret: string, now = Date.now()): string {
  const payload = `${requestId}.${Math.floor(now / 1000) + TRACK_TTL_SECONDS}`;
  return `${payload}.${mac(payload, secret)}`;
}

/** The request id the cookie grants, or null if missing, tampered or expired. */
export function verifyTrackToken(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): string | null {
  if (!value) return null;
  const [requestId, exp, signature, extra] = value.split(".");
  if (!requestId || !exp || !signature || extra !== undefined) return null;
  if (!/^[a-z0-9]{10,40}$/i.test(requestId) || !/^\d{1,12}$/.test(exp)) return null;
  const expected = Buffer.from(mac(`${requestId}.${exp}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number(exp) * 1000 > now ? requestId : null;
}
