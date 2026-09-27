// Calendar/datetime helpers for form values. Asia/Dhaka is UTC+6 all year (no DST since 2009).
import { dhakaYmd } from "@/lib/time";

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

export const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;

/** Today's calendar date in Dhaka as `YYYY-MM-DD`. */
export function dhakaToday(now: Date = new Date()): string {
  const { year, month, day } = dhakaYmd(now);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** `YYYY-MM-DD` shifted by whole days. */
export function addDays(ymd: string, days: number): string {
  const [, y, m, d] = DATE_RE.exec(ymd)!;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** True for a real calendar date (rejects 2026-02-30). */
export function isValidDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** `YYYY-MM-DDTHH:mm` entered in Dhaka → the UTC instant, or null if invalid. */
export function dhakaLocalToInstant(value: string): Date | null {
  const match = DATETIME_RE.exec(value);
  if (!match || !isValidDate(value.slice(0, 10))) return null;
  const [, y, m, d, h, min] = match.map(Number) as [number, number, number, number, number, number];
  return new Date(Date.UTC(y, m - 1, d, h, min) - DHAKA_OFFSET_MS);
}
