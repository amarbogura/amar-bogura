import { z } from "zod";

import { toBanglaDigits, toLatinDigits } from "@/lib/bangla";

/** Bangladeshi mobile number: optional +880/880 or leading 0, then operator prefix 13–19, then 8 digits. */
export const BD_PHONE_REGEX = /^(\+?880|0)1[3-9]\d{8}$/;

function clean(input: string): string {
  return toLatinDigits(input.trim()).replace(/[\s\-().]/g, "");
}

export function isBdPhone(input: string): boolean {
  return BD_PHONE_REGEX.test(clean(input));
}

/**
 * Normalizes any accepted BD mobile format (01…, 8801…, +8801…, Bangla digits, spaces/dashes)
 * to E.164 `+8801XXXXXXXXX`. Returns `null` when the input is not a valid BD mobile number.
 */
export function normalizeBdPhone(input: string): string | null {
  const cleaned = clean(input);
  if (!BD_PHONE_REGEX.test(cleaned)) return null;
  return `+880${cleaned.replace(/^(\+?880|0)/, "")}`;
}

/** Formats an E.164 BD number for display: `+8801712345678` → `০১৭১২-৩৪৫৬৭৮`. */
export function formatBdPhoneDisplay(e164: string): string {
  const normalized = normalizeBdPhone(e164);
  if (!normalized) return e164;
  const local = `0${normalized.slice(4)}`;
  return toBanglaDigits(`${local.slice(0, 5)}-${local.slice(5)}`);
}

/** Zod schema for user-entered BD mobile numbers; outputs E.164. */
export const bdPhoneSchema = z
  .string()
  .trim()
  .min(1, "মোবাইল নম্বর দিন")
  .transform((value, ctx) => {
    const normalized = normalizeBdPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)" });
      return z.NEVER;
    }
    return normalized;
  });
