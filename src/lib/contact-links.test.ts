import { relativeTimeBn, telHref, whatsappHref } from "./contact-links";
import { categoryHref, routes } from "./routes";

describe("telHref", () => {
  it("builds tel: links from any BD format", () => {
    expect(telHref("01712-345678")).toBe("tel:+8801712345678");
    expect(telHref("+8801712345678")).toBe("tel:+8801712345678");
  });

  it("returns null for missing or invalid numbers", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("")).toBeNull();
    expect(telHref("12345")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("uses digits only and encodes Bangla text", () => {
    expect(whatsappHref("+8801712345678")).toBe("https://wa.me/8801712345678");
    expect(whatsappHref("01712345678", "রিকোয়েস্ট AB-1")).toBe(
      `https://wa.me/8801712345678?text=${encodeURIComponent("রিকোয়েস্ট AB-1")}`,
    );
  });

  it("returns null without a valid number", () => {
    expect(whatsappHref(undefined)).toBeNull();
  });
});

describe("relativeTimeBn", () => {
  const now = new Date("2026-09-27T12:00:00Z");
  it.each([
    ["2026-09-27T11:59:30Z", "এইমাত্র"],
    ["2026-09-27T11:55:00Z", "৫ মিনিট আগে"],
    ["2026-09-27T09:00:00Z", "৩ ঘণ্টা আগে"],
    ["2026-09-25T12:00:00Z", "২ দিন আগে"],
    ["2026-09-06T12:00:00Z", "৩ সপ্তাহ আগে"],
    ["2025-09-27T12:00:00Z", "১ বছর আগে"],
  ])("%s → %s", (date, expected) => {
    expect(relativeTimeBn(date, now)).toBe(expected);
  });
});

describe("routes", () => {
  it("routes categories by kind (D-14)", () => {
    expect(categoryHref("SERVICE", "home-office")).toBe("/services/home-office");
    expect(categoryHref("MARKETPLACE", "buy-sell")).toBe("/buy-sell");
    expect(categoryHref("PROPERTY", "property")).toBe("/property");
    expect(categoryHref("CUSTOM_REQUEST", "custom-request")).toBe("/request/custom");
  });

  it("encodes search queries", () => {
    expect(routes.search("এসি সার্ভিস")).toBe(`/search?q=${encodeURIComponent("এসি সার্ভিস")}`);
  });
});
