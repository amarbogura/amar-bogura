import type { Locale } from "@/i18n/config";
import { DHAKA_TZ, formatDate, formatDateTime, formatTime } from "@/i18n/format";

export { DHAKA_TZ };

type DateInput = Date | string | number;

const toDate = (input: DateInput) => (input instanceof Date ? input : new Date(input));

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DHAKA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `২৭ সেপ্টেম্বর, ২০২৬` */
export function formatDhakaDate(input: DateInput, locale: Locale = "bn"): string {
  return formatDate(input, locale);
}

/** `২৭ সেপ, ২০২৬, ১:৩০ AM` */
export function formatDhakaDateTime(input: DateInput, locale: Locale = "bn"): string {
  return formatDateTime(input, locale);
}

/** `১:৩০ AM` */
export function formatDhakaTime(input: DateInput, locale: Locale = "bn"): string {
  return formatTime(input, locale);
}

/** Calendar date in Dhaka for the given instant (used for daily sequences like `AB-YYMMDD-XXXX`). */
export function dhakaYmd(input: DateInput = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = partsFormatter.formatToParts(toDate(input));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Offset of Dhaka from UTC at the given instant, in minutes (derived from Intl, not hardcoded). */
function dhakaOffsetMinutes(instant: Date): number {
  const { year, month, day } = dhakaYmd(instant);
  const hm = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = Number(hm.find((p) => p.type === "hour")?.value);
  const minute = Number(hm.find((p) => p.type === "minute")?.value);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const truncated = Math.floor(instant.getTime() / 60_000) * 60_000;
  return Math.round((asUtc - truncated) / 60_000);
}

/** The UTC instant at which the Dhaka calendar day containing `input` begins. */
export function startOfDhakaDay(input: DateInput = new Date()): Date {
  const instant = toDate(input);
  const { year, month, day } = dhakaYmd(instant);
  return new Date(Date.UTC(year, month - 1, day) - dhakaOffsetMinutes(instant) * 60_000);
}
