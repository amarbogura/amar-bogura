import { formatTaka } from "./money";

describe("formatTaka", () => {
  it.each([
    [0, "৳০"],
    [500, "৳৫০০"],
    [1200, "৳১,২০০"],
    [100000, "৳১,০০,০০০"],
    [1234567, "৳১২,৩৪,৫৬৭"],
    [-500, "-৳৫০০"],
  ])("%d → %s", (amount, expected) => {
    expect(formatTaka(amount)).toBe(expected);
  });

  it.each([12.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects non-integer %s", (amount) => {
    expect(() => formatTaka(amount)).toThrow(RangeError);
  });
});
