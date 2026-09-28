import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/lib/redis";

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

/** Every rate limit in the app, in one place. Keys are namespaced by policy name. */
export const RATE_LIMIT_POLICIES = {
  otpSendPhone: { limit: 3, window: "10 m" },
  otpSendIp: { limit: 10, window: "1 h" },
  otpVerifyIp: { limit: 10, window: "10 m" },
  adminLogin: { limit: 5, window: "15 m" },
  twoFactorVerify: { limit: 5, window: "15 m" },
  profileUpdate: { limit: 10, window: "1 h" },
  adminAction: { limit: 120, window: "1 m" },
  uploadSignUser: { limit: 60, window: "1 h" },
  uploadSignGuest: { limit: 20, window: "1 h" },
  mediaRegister: { limit: 60, window: "1 h" },
  // P7 requests (docs/04): users 5/h; guests 3/h per IP + 5/day per phone; emergency looser.
  requestUser: { limit: 5, window: "1 h" },
  requestGuestIp: { limit: 3, window: "1 h" },
  requestGuestPhone: { limit: 5, window: "1 d" },
  requestEmergencyIp: { limit: 20, window: "1 h" },
  requestCancel: { limit: 20, window: "1 h" },
  trackOtpPhone: { limit: 3, window: "10 m" },
  trackOtpIp: { limit: 10, window: "1 h" },
  trackVerifyIp: { limit: 10, window: "10 m" },
} as const satisfies Record<string, { limit: number; window: Window }>;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

const limiters = new Map<RateLimitPolicyName, Ratelimit>();

function limiterFor(policy: RateLimitPolicyName): Ratelimit {
  let limiter = limiters.get(policy);
  if (!limiter) {
    const { limit, window } = RATE_LIMIT_POLICIES[policy];
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${policy}`,
      analytics: false,
    });
    limiters.set(policy, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  /** Seconds until the caller may retry (0 when allowed). */
  retryAfter: number;
}

export async function rateLimit(
  policy: RateLimitPolicyName,
  key: string,
): Promise<RateLimitResult> {
  const { success, reset } = await limiterFor(policy).limit(key);
  return { success, retryAfter: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}
