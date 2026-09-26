import { toBanglaDigits, toLatinDigits } from "./bangla";

describe("toBanglaDigits", () => {
  it.each([
    [0, "০"],
    [1234567890, "১২৩৪৫৬৭৮৯০"],
    ["AB-260927-0042", "AB-২৬০৯২৭-০০৪২"],
    ["no digits", "no digits"],
  ])("%s → %s", (input, expected) => {
    expect(toBanglaDigits(input)).toBe(expected);
  });
});

describe("toLatinDigits", () => {
  it("converts Bangla digits and keeps other characters", () => {
    expect(toLatinDigits("০১৭১২-৩৪৫৬৭৮")).toBe("01712-345678");
    expect(toLatinDigits("এসি ২ টন")).toBe("এসি 2 টন");
  });

  it("round-trips with toBanglaDigits", () => {
    expect(toLatinDigits(toBanglaDigits("9876543210"))).toBe("9876543210");
  });
});
