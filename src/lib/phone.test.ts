import { bdPhoneSchema, formatBdPhoneDisplay, isBdPhone, normalizeBdPhone } from "./phone";

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "+8801712345678"],
    ["8801712345678", "+8801712345678"],
    ["+8801712345678", "+8801712345678"],
    ["  01712-345678 ", "+8801712345678"],
    ["+880 1712 345 678", "+8801712345678"],
    ["(017) 1234-5678", "+8801712345678"],
    ["০১৭১২৩৪৫৬৭৮", "+8801712345678"],
    ["+৮৮০১৯১১২২২৩৩৩", "+8801911222333"],
    ["01312345678", "+8801312345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeBdPhone(input)).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["01212345678", "invalid operator prefix 12"],
    ["01112345678", "invalid operator prefix 11"],
    ["0171234567", "too short"],
    ["017123456789", "too long"],
    ["+8811712345678", "wrong country code"],
    ["1712345678", "missing leading 0"],
    ["0171234567a", "non-digit"],
    ["+88001712345678", "country code plus trunk 0"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeBdPhone(input)).toBeNull();
    expect(isBdPhone(input)).toBe(false);
  });
});

describe("formatBdPhoneDisplay", () => {
  it("formats E.164 as local Bangla digits", () => {
    expect(formatBdPhoneDisplay("+8801712345678")).toBe("০১৭১২-৩৪৫৬৭৮");
  });

  it("returns invalid input unchanged", () => {
    expect(formatBdPhoneDisplay("12345")).toBe("12345");
  });
});

describe("bdPhoneSchema", () => {
  it("outputs E.164", () => {
    expect(bdPhoneSchema.parse(" 01812-345678 ")).toBe("+8801812345678");
  });

  it("returns a Bangla error for invalid numbers", () => {
    const result = bdPhoneSchema.safeParse("01212345678");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/সঠিক মোবাইল নম্বর/);
  });

  it("requires a value", () => {
    const result = bdPhoneSchema.safeParse("   ");
    expect(result.error?.issues[0]?.message).toBe("মোবাইল নম্বর দিন");
  });
});
