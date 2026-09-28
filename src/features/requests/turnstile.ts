import "server-only";

import { env } from "@/env";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = "ok" | "invalid" | "unavailable";

/**
 * Server-side check of a Turnstile token (guest submits, D-03). "unavailable" = Cloudflare could
 * not be reached — callers decide (emergency requests are never blocked by it).
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
  fetcher: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (!token || token.length > 2048) return "invalid";
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const response = await fetcher(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unavailable";
    const data = (await response.json()) as { success?: boolean };
    return data.success ? "ok" : "invalid";
  } catch {
    return "unavailable";
  }
}
