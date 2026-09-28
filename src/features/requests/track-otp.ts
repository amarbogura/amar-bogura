import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "@/env";
import { getRedis } from "@/lib/redis";

/**
 * One-time codes for `/track` (D-03). Separate from Better Auth's phone OTP on purpose: tracking a
 * request must not create an account. Stored hashed in Upstash for 5 minutes, max 5 attempts.
 */
export const TRACK_OTP_TTL_SECONDS = 5 * 60;
export const TRACK_OTP_MAX_ATTEMPTS = 5;

interface StoredOtp {
  hash: string;
  attempts: number;
}

const key = (requestId: string) => `track-otp:${requestId}`;
const hashCode = (requestId: string, code: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`track-otp:${requestId}:${code}`)
    .digest("hex");

/** Issues a new code for the request (replacing any previous one) and returns it for the SMS. */
export async function issueTrackOtp(requestId: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const value: StoredOtp = { hash: hashCode(requestId, code), attempts: 0 };
  await getRedis().set(key(requestId), value, { ex: TRACK_OTP_TTL_SECONDS });
  return code;
}

export type TrackOtpCheck = "ok" | "invalid" | "expired";

/** Checks a code; a correct code is consumed, the 5th wrong attempt burns it. */
export async function checkTrackOtp(requestId: string, code: string): Promise<TrackOtpCheck> {
  const redis = getRedis();
  const stored = await redis.get<StoredOtp>(key(requestId));
  if (!stored) return "expired";

  const expected = Buffer.from(stored.hash);
  const given = Buffer.from(hashCode(requestId, code));
  if (expected.length === given.length && timingSafeEqual(expected, given)) {
    await redis.del(key(requestId));
    return "ok";
  }

  const attempts = stored.attempts + 1;
  if (attempts >= TRACK_OTP_MAX_ATTEMPTS) {
    await redis.del(key(requestId));
    return "expired";
  }
  await redis.set(key(requestId), { ...stored, attempts }, { keepTtl: true });
  return "invalid";
}
