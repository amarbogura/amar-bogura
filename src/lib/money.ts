import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/i18n/format";

/**
 * Formats an integer BDT amount: `৳১,২০০` (bn, default) / `৳1,200` (en), South Asian grouping.
 * Money is stored as whole taka, so a non-integer is a programming error.
 */
export function formatTaka(amount: number, locale: Locale = "bn"): string {
  return formatMoney(amount, locale);
}
