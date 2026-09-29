import "server-only";

import { headers } from "next/headers";
import type { z } from "zod";

import { env } from "@/env";
import { getRequestT, getT, type T } from "@/i18n/server";
import { type AuditEntry, writeAuditLog } from "@/lib/audit";
import type { Permission } from "@/lib/permissions";
import { rateLimit, type RateLimitPolicyName } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request-ip";
import { type AdminSession, requireAdmin, type Session, getSession } from "@/lib/session";

export type ActionError = { ok: false; status: 400 | 401 | 403 | 404 | 409 | 429; error: string };
export type ActionResult<T = void> = { ok: true; data: T } | ActionError;

/**
 * An error result. Pass the message in the caller's language (`actionI18n()`); without one the
 * generic message for the status is used in Bangla (default locale).
 */
export const fail = (status: ActionError["status"], error?: string, t?: T): ActionError => ({
  ok: false,
  status,
  error: error ?? (t ?? DEFAULT_T)(`errors.${status}`),
});

const DEFAULT_T = getT("bn");

/**
 * For Server Actions: the translator of the page that called the action (its Referer) and a
 * `fail` whose default message is in that language.
 */
export async function actionI18n(): Promise<{
  t: T;
  fail: (status: ActionError["status"], error?: string) => ActionError;
}> {
  const t = await getRequestT();
  return { t, fail: (status, error) => fail(status, error, t) };
}

/** Schemas may be built per request so their messages use the caller's language. */
type SchemaSource<S extends z.ZodType> = S | ((t: T) => S);
const resolveSchema = <S extends z.ZodType>(source: SchemaSource<S>, t: T): S =>
  typeof source === "function" ? (source as (t: T) => S)(t) : source;

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export interface AdminActionContext {
  session: AdminSession;
  /** Hashed client IP for AuditLog rows. */
  ipHash: string;
  /** Translator for the caller's language. */
  t: T;
  /**
   * withAudit: writes one AuditLog row for this admin (actor + hashed IP filled in). Call it inside
   * the same transaction as the change it records.
   */
  audit: (tx: AuditWriter, entry: Omit<AuditEntry, "actorId" | "ipHash">) => Promise<void>;
}

type AuditWriter = Parameters<typeof writeAuditLog>[0];

/**
 * Every admin Server Action MUST be built with this (and live in `src/features/**\/admin-actions.ts`,
 * where the guard test finds it). Order: authorization → rate limit → Zod → handler, so a
 * non-admin gets 403 before any input is parsed or any data is touched.
 */
export function adminAction<S extends z.ZodType, R>(
  permission: Permission,
  schema: SchemaSource<S>,
  handler: (input: z.output<S>, ctx: AdminActionContext) => Promise<ActionResult<R>>,
): (input: z.input<S>) => Promise<ActionResult<R>> {
  return async (input) => {
    const { t, fail } = await actionI18n();
    const check = await requireAdmin(permission);
    if (!check.ok) return fail(check.status);

    const ip = getClientIp(await headers());
    if (!(await rateLimit("adminAction", check.session.user.id)).success) return fail(429);

    const parsed = resolveSchema(schema, t).safeParse(input);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message);

    const ipHash = hashIp(ip, env.BETTER_AUTH_SECRET);
    const actorId = check.session.user.id;
    return handler(parsed.data as z.output<S>, {
      session: check.session,
      ipHash,
      t,
      audit: (tx, entry) => writeAuditLog(tx, { ...entry, actorId, ipHash }),
    });
  };
}

/** Same pipeline for logged-in user actions. */
export function userAction<S extends z.ZodType, R>(
  policy: RateLimitPolicyName,
  schema: SchemaSource<S>,
  handler: (input: z.output<S>, session: Session, t: T) => Promise<ActionResult<R>>,
): (input: z.input<S>) => Promise<ActionResult<R>> {
  return async (input) => {
    const { t, fail } = await actionI18n();
    const session = await getSession();
    if (!session) return fail(401);
    if (!(await rateLimit(policy, session.user.id)).success) return fail(429);
    const parsed = resolveSchema(schema, t).safeParse(input);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message);
    return handler(parsed.data as z.output<S>, session, t);
  };
}
