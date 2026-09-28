import type { Prisma } from "@/generated/prisma/client";
import { dhakaYmd } from "@/lib/time";

const pad = (value: number, length: number) => String(value).padStart(length, "0");

/** `AB-260928-` — the request code prefix for the Dhaka calendar day of `now`. */
export function requestCodePrefix(now: Date): string {
  const { year, month, day } = dhakaYmd(now);
  return `AB-${pad(year % 100, 2)}${pad(month, 2)}${pad(day, 2)}-`;
}

/** `AB-YYMMDD-XXXX`, 4-digit per-day sequence (more digits only past 9999 in one day). */
export const REQUEST_CODE_REGEX = /^AB-\d{6}-\d{4,}$/;

/** Normalizes user-typed codes ("ab-260928-0012 " → "AB-260928-0012"); null if malformed. */
export function normalizeRequestCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return REQUEST_CODE_REGEX.test(code) ? code : null;
}

/**
 * Next code for today: highest existing sequence + 1. Two concurrent submits can compute the same
 * code — the unique index rejects one and `withCodeRetry` runs it again.
 */
export async function nextRequestCode(
  tx: Pick<Prisma.TransactionClient, "serviceRequest">,
  now: Date,
): Promise<string> {
  const prefix = requestCodePrefix(now);
  const latest = await tx.serviceRequest.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });
  const highest = latest.reduce((max, { code }) => {
    const seq = Number(code.slice(prefix.length));
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return `${prefix}${pad(highest + 1, 4)}`;
}

/** Prisma unique-constraint violation on `ServiceRequest.code`. */
export function isCodeConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, meta } = error as { code?: string; meta?: { target?: unknown } };
  if (code !== "P2002") return false;
  const target = meta?.target;
  // Driver adapters may omit the target; any P2002 inside the create transaction is the code.
  return target === undefined || JSON.stringify(target).includes("code");
}

export async function withCodeRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts || !isCodeConflict(error)) throw error;
    }
  }
}
