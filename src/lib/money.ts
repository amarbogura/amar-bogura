const takaNumber = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });

/**
 * Formats an integer BDT amount as `৳১,২০০` (Bangla digits, South Asian grouping: `৳১,০০,০০০`).
 * Money is stored as whole taka, so a non-integer is a programming error.
 */
export function formatTaka(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`formatTaka expects an integer amount of taka, got ${amount}`);
  }
  const formatted = takaNumber.format(Math.abs(amount));
  return amount < 0 ? `-৳${formatted}` : `৳${formatted}`;
}
