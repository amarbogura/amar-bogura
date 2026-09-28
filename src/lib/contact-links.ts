import type { Locale } from "@/i18n/config";
import { relativeTime } from "@/i18n/format";
import { normalizeBdPhone } from "@/lib/phone";

/** National Emergency Service. The only non-mobile number we ever link to. */
export const NATIONAL_EMERGENCY_NUMBER = "999";

/** `tel:` link for a BD mobile number (or 999), or null when the number is missing/invalid. */
export function telHref(phone: string | null | undefined): string | null {
  if (phone?.trim() === NATIONAL_EMERGENCY_NUMBER) return `tel:${NATIONAL_EMERGENCY_NUMBER}`;
  const e164 = phone ? normalizeBdPhone(phone) : null;
  return e164 ? `tel:${e164}` : null;
}

/** WhatsApp click-to-chat link (wa.me needs digits only, no "+"). */
export function whatsappHref(phone: string | null | undefined, text?: string): string | null {
  const e164 = phone ? normalizeBdPhone(phone) : null;
  if (!e164) return null;
  const base = `https://wa.me/${e164.slice(1)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "৫ মিনিট আগে" / "5 minutes ago". `now` is injectable for tests. */
export function relativeTimeBn(date: Date | string, now: Date = new Date()): string {
  return relativeTime(date, "bn", now);
}

export function relativeTimeIn(
  locale: Locale,
  date: Date | string,
  now: Date = new Date(),
): string {
  return relativeTime(date, locale, now);
}
