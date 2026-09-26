const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/** Converts ASCII digits to Bangla digits; all other characters pass through unchanged. */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]!);
}

/** Converts Bangla digits (০-৯) to ASCII digits; used when normalizing phone numbers and search input. */
export function toLatinDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}
