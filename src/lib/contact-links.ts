import { toBanglaDigits } from "@/lib/bangla";
import { normalizeBdPhone } from "@/lib/phone";

/** `tel:` link for a BD mobile number, or null when the number is missing/invalid. */
export function telHref(phone: string | null | undefined): string | null {
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

const UNITS: Array<[seconds: number, label: string]> = [
  [60 * 60 * 24 * 365, "বছর"],
  [60 * 60 * 24 * 30, "মাস"],
  [60 * 60 * 24 * 7, "সপ্তাহ"],
  [60 * 60 * 24, "দিন"],
  [60 * 60, "ঘণ্টা"],
  [60, "মিনিট"],
];

/** "৫ মিনিট আগে", "২ দিন আগে", "এইমাত্র". `now` is injectable for tests. */
export function relativeTimeBn(date: Date | string, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "এইমাত্র";
  for (const [unitSeconds, label] of UNITS) {
    if (seconds >= unitSeconds)
      return `${toBanglaDigits(Math.floor(seconds / unitSeconds))} ${label} আগে`;
  }
  return "এইমাত্র";
}
