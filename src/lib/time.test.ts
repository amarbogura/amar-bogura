import {
  dhakaYmd,
  formatDhakaDate,
  formatDhakaDateTime,
  formatDhakaTime,
  startOfDhakaDay,
} from "./time";

describe("dhakaYmd", () => {
  it("uses the Dhaka calendar day, not UTC", () => {
    // 17:59 UTC = 23:59 Dhaka, same day
    expect(dhakaYmd(new Date("2026-09-26T17:59:00Z"))).toEqual({ year: 2026, month: 9, day: 26 });
    // 18:00 UTC = 00:00 Dhaka, next day
    expect(dhakaYmd(new Date("2026-09-26T18:00:00Z"))).toEqual({ year: 2026, month: 9, day: 27 });
  });

  it("rolls over month and year boundaries", () => {
    expect(dhakaYmd("2026-12-31T20:00:00Z")).toEqual({ year: 2027, month: 1, day: 1 });
  });
});

describe("startOfDhakaDay", () => {
  it("returns Dhaka midnight as a UTC instant", () => {
    expect(startOfDhakaDay(new Date("2026-09-26T23:30:00Z")).toISOString()).toBe(
      "2026-09-26T18:00:00.000Z",
    );
    expect(startOfDhakaDay(new Date("2026-09-26T05:00:00Z")).toISOString()).toBe(
      "2026-09-25T18:00:00.000Z",
    );
  });

  it("is idempotent at midnight", () => {
    const midnight = new Date("2026-09-26T18:00:00Z");
    expect(startOfDhakaDay(midnight).toISOString()).toBe(midnight.toISOString());
  });
});

describe("Bangla formatters", () => {
  const instant = new Date("2026-09-26T19:30:00Z"); // 27 Sep 2026, 01:30 in Dhaka

  it("formats the date in Dhaka with Bangla digits", () => {
    const text = formatDhakaDate(instant);
    expect(text).toContain("২৭");
    expect(text).toContain("২০২৬");
  });

  it("formats date-time and time in Dhaka", () => {
    expect(formatDhakaDateTime(instant)).toContain("১:৩০");
    expect(formatDhakaTime(instant)).toContain("১:৩০");
  });
});
