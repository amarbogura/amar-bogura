// Locale-aware numbers, money and dates (Asia/Dhaka). Bangla uses Bangla digits; English uses
// Latin digits. Both use South Asian grouping (১২,০০,০০০ / 12,00,000).
import { DEFAULT_LOCALE, INTL_DATE_LOCALE, INTL_NUMBER_LOCALE, type Locale } from "./config";

export const DHAKA_TZ = "Asia/Dhaka";

type DateInput = Date | string | number;
const toDate = (input: DateInput) => (input instanceof Date ? input : new Date(input));

const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/** ASCII digits → Bangla digits (other characters unchanged). */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]!);
}

/** Bangla digits → ASCII digits (phone numbers, search input, numeric form fields). */
export function toLatinDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** Digits in the script of `locale`. */
export function toLocaleDigits(input: string | number, locale: Locale = DEFAULT_LOCALE): string {
  return locale === "bn" ? toBanglaDigits(input) : toLatinDigits(String(input));
}

const numberFormatters = new Map<Locale, Intl.NumberFormat>();
function numberFormatter(locale: Locale): Intl.NumberFormat {
  let formatter = numberFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_NUMBER_LOCALE[locale], { maximumFractionDigits: 2 });
    numberFormatters.set(locale, formatter);
  }
  return formatter;
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return numberFormatter(locale).format(value);
}

/**
 * Integer BDT → `৳১,২০০` (bn) / `৳1,200` (en). Money is stored as whole taka, so a non-integer is
 * a programming error.
 */
export function formatMoney(amount: number, locale: Locale = DEFAULT_LOCALE): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`formatMoney expects an integer amount of taka, got ${amount}`);
  }
  const formatted = numberFormatter(locale).format(Math.abs(amount));
  return amount < 0 ? `-৳${formatted}` : `৳${formatted}`;
}

type DateStyle = "date" | "dateTime" | "time";
const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "long" },
  dateTime: { dateStyle: "medium", timeStyle: "short" },
  time: { timeStyle: "short" },
};
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(style: DateStyle, locale: Locale): Intl.DateTimeFormat {
  const key = `${style}:${locale}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(INTL_DATE_LOCALE[locale], {
      timeZone: DHAKA_TZ,
      ...DATE_OPTIONS[style],
    });
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

/** `২৭ সেপ্টেম্বর, ২০২৬` / `September 27, 2026` */
export function formatDate(input: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  return dateFormatter("date", locale).format(toDate(input));
}

/** `২৭ সেপ, ২০২৬, ১:৩০ AM` / `Sep 27, 2026, 1:30 AM` */
export function formatDateTime(input: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  return dateFormatter("dateTime", locale).format(toDate(input));
}

/** `১:৩০ AM` / `1:30 AM` */
export function formatTime(input: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  return dateFormatter("time", locale).format(toDate(input));
}

const RELATIVE_UNITS: Array<[seconds: number, unit: Intl.RelativeTimeFormatUnit]> = [
  [60 * 60 * 24 * 365, "year"],
  [60 * 60 * 24 * 30, "month"],
  [60 * 60 * 24 * 7, "week"],
  [60 * 60 * 24, "day"],
  [60 * 60, "hour"],
  [60, "minute"],
];
const BN_UNIT_LABELS: Record<string, string> = {
  year: "বছর",
  month: "মাস",
  week: "সপ্তাহ",
  day: "দিন",
  hour: "ঘণ্টা",
  minute: "মিনিট",
};

/** "৫ মিনিট আগে" / "5 minutes ago"; under a minute: "এইমাত্র" / "just now". */
export function relativeTime(
  date: DateInput,
  locale: Locale = DEFAULT_LOCALE,
  now: Date = new Date(),
): string {
  const seconds = Math.floor((now.getTime() - toDate(date).getTime()) / 1000);
  for (const [unitSeconds, unit] of RELATIVE_UNITS) {
    if (seconds >= unitSeconds) {
      const count = Math.floor(seconds / unitSeconds);
      return locale === "bn"
        ? `${toBanglaDigits(count)} ${BN_UNIT_LABELS[unit]} আগে`
        : new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(-count, unit);
    }
  }
  return locale === "bn" ? "এইমাত্র" : "just now";
}
