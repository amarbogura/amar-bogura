// DB-backed e2e helpers (dev server only). Loads .env.local like Next does.
import "../../prisma/seed/load-env";

import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";
import type { Page } from "@playwright/test";
import { Redis } from "@upstash/redis";

// Plain SQL: the generated Prisma client is ESM-only and Playwright loads specs as CommonJS.
const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

/** A fresh valid BD mobile per test run (never a real customer's number). */
export function testPhone(): { local: string; e164: string } {
  const digits = String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
  const local = `0139${digits}`;
  return { local, e164: `+880${local.slice(1)}` };
}

/**
 * Local runs share one IP ("::1"), so guest limits (3 requests/hour per IP) would trip after a
 * couple of runs. Clears only rate-limit keys of loopback identifiers.
 */
export async function resetLocalRateLimits(): Promise<void> {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  for (const match of ["rl:*:::1*", "rl:*:127.0.0.1*", "rl:*:::ffff:127.0.0.1*", "rl:*:unknown*"]) {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, { match, count: 500 });
      if (keys.length) await redis.del(...keys);
      cursor = String(next);
    } while (cursor !== "0");
  }
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toLatin = (text: string) =>
  text.replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)));

/** Latest 6-digit code the console SMS provider sent to `e164` (dev outbox file). */
export async function latestOtp(e164: string, after: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const lines = (await readFile(".sms-outbox.jsonl", "utf8").catch(() => ""))
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { to: string; text: string; at: number })
      .filter((sms) => sms.to === e164 && sms.at >= after);
    // "…কোড ১২৩৪৫৬…" / "…code 123456…" — anchored on the word: track SMS also contain request code digits.
    const code = lines.at(-1) && toLatin(lines.at(-1)!.text).match(/(?:কোড|code) (\d{6})/i)?.[1];
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No OTP sent to ${e164}`);
}

/** Removes everything the run created for these phones (requests cascade to events/attachments). */
export async function cleanupPhones(phones: string[]): Promise<void> {
  await sql`DELETE FROM "ServiceRequest" WHERE "contactPhone" = ANY(${phones})`;
  await sql`DELETE FROM "user" WHERE "phoneNumber" = ANY(${phones})`;
  await sql`DELETE FROM "BlockedPhone" WHERE "phone" = ANY(${phones})`;
}

/** Audit actions written for one entity, oldest first. */
export async function auditActions(entityId: string): Promise<string[]> {
  const rows =
    await sql`SELECT "action" FROM "AuditLog" WHERE "entityId" = ${entityId} ORDER BY "createdAt"`;
  return rows.map((row) => String(row.action));
}

/** A few columns of one request, looked up by its public code. */
export async function requestRow(code: string) {
  const [row] =
    await sql`SELECT "id", "status", "source", "isSpam", "userId", "quotedAmount" FROM "ServiceRequest" WHERE "code" = ${code}`;
  return row as {
    id: string;
    status: string;
    source: string;
    isSpam: boolean;
    userId: string | null;
    quotedAmount: number | null;
  };
}

/**
 * Waits until React has hydrated the page: the header language switcher renders a fallback link
 * (the other language's home) in HTML and the real same-page link only on the client. Clicking
 * before that submits forms natively, so their client-side handlers never run.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const link = document.querySelector<HTMLAnchorElement>("header a[hreflang]");
    if (!link) return false;
    const href = link.getAttribute("href") ?? "";
    const here = window.location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    return here === "/" || (href !== "/en" && href !== "/");
  });
}
