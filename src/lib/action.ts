import "server-only";

import { headers } from "next/headers";
import type { z } from "zod";

import { env } from "@/env";
import type { Permission } from "@/lib/permissions";
import { rateLimit, type RateLimitPolicyName } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request-ip";
import { type AdminSession, requireAdmin, type Session, getSession } from "@/lib/session";

export type ActionError = { ok: false; status: 400 | 401 | 403 | 404 | 409 | 429; error: string };
export type ActionResult<T = void> = { ok: true; data: T } | ActionError;

export const ERRORS = {
  400: "তথ্য সঠিক নয়। আবার দেখে নিন।",
  401: "অনুগ্রহ করে লগইন করুন।",
  403: "এই কাজের অনুমতি আপনার নেই।",
  404: "খুঁজে পাওয়া যায়নি।",
  429: "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
} as const;

export const fail = (status: ActionError["status"], error?: string): ActionError => ({
  ok: false,
  status,
  error: error ?? ERRORS[status as keyof typeof ERRORS] ?? ERRORS[400],
});

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export interface AdminActionContext {
  session: AdminSession;
  /** Hashed client IP for AuditLog rows. */
  ipHash: string;
}

/**
 * Every admin Server Action MUST be built with this (and live in `src/features/**\/admin-actions.ts`,
 * where the guard test finds it). Order: authorization → rate limit → Zod → handler, so a
 * non-admin gets 403 before any input is parsed or any data is touched.
 */
export function adminAction<S extends z.ZodType, T>(
  permission: Permission,
  schema: S,
  handler: (input: z.output<S>, ctx: AdminActionContext) => Promise<ActionResult<T>>,
): (input: z.input<S>) => Promise<ActionResult<T>> {
  return async (input) => {
    const check = await requireAdmin(permission);
    if (!check.ok) return fail(check.status);

    const ip = getClientIp(await headers());
    if (!(await rateLimit("adminAction", check.session.user.id)).success) return fail(429);

    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message);

    return handler(parsed.data, {
      session: check.session,
      ipHash: hashIp(ip, env.BETTER_AUTH_SECRET),
    });
  };
}

/** Same pipeline for logged-in user actions. */
export function userAction<S extends z.ZodType, T>(
  policy: RateLimitPolicyName,
  schema: S,
  handler: (input: z.output<S>, session: Session) => Promise<ActionResult<T>>,
): (input: z.input<S>) => Promise<ActionResult<T>> {
  return async (input) => {
    const session = await getSession();
    if (!session) return fail(401);
    if (!(await rateLimit(policy, session.user.id)).success) return fail(429);
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message);
    return handler(parsed.data, session);
  };
}
