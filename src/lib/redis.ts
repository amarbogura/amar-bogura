import "server-only";

import { Redis } from "@upstash/redis";

import { env } from "@/env";

let redis: Redis | undefined;

/** Shared Upstash client (rate limits, short-lived OTP codes). */
export function getRedis(): Redis {
  redis ??= new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  return redis;
}
