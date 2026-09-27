import { parseSiteSettings } from "./settings";

describe("parseSiteSettings", () => {
  it("reads configured values", () => {
    expect(
      parseSiteSettings([
        { key: "hotline", value: { phone: "+8801700000000" } },
        { key: "ambulance_phone", value: { phone: "+8801800000000" } },
        { key: "emergency_chip", value: { enabled: false } },
      ]),
    ).toMatchObject({
      hotline: "+8801700000000",
      ambulancePhone: "+8801800000000",
      emergencyChipEnabled: false,
    });
  });

  it("falls back safely for missing or malformed rows (never breaks the shell)", () => {
    expect(
      parseSiteSettings([
        { key: "hotline", value: "not an object" },
        { key: "emergency_chip", value: { enabled: "yes" } },
      ]),
    ).toEqual({
      hotline: null,
      whatsapp: null,
      ambulancePhone: null,
      emergencyChipEnabled: true,
      facebookUrl: null,
      youtubeUrl: null,
    });
  });
});
