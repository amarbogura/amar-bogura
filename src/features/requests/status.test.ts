import { canCancel, parseRequestFilter, requestPriority } from "./status";
import { signTrackToken, TRACK_TTL_SECONDS, verifyTrackToken } from "./track-token";

describe("requestPriority", () => {
  it("makes emergency services and emergency answers EMERGENCY", () => {
    expect(requestPriority(true, {})).toBe("EMERGENCY");
    expect(requestPriority(false, { urgency: "emergency" })).toBe("EMERGENCY");
  });

  it("makes same-day answers HIGH and everything else NORMAL", () => {
    expect(requestPriority(false, { urgency: "today" })).toBe("HIGH");
    expect(requestPriority(false, { urgency: "within_1h" })).toBe("HIGH");
    expect(requestPriority(false, { urgency: "normal" })).toBe("NORMAL");
    expect(requestPriority(false, {})).toBe("NORMAL");
  });
});

describe("status helpers", () => {
  it("allows cancelling only before work starts", () => {
    expect(canCancel("NEW")).toBe(true);
    expect(canCancel("REVIEWING")).toBe(true);
    expect(canCancel("PROCESSING")).toBe(false);
    expect(canCancel("COMPLETED")).toBe(false);
  });

  it("parses the list filter safely", () => {
    expect(parseRequestFilter("active")).toBe("active");
    expect(parseRequestFilter("constructor")).toBe("all");
    expect(parseRequestFilter(["done"])).toBe("all");
  });
});

describe("track token", () => {
  const secret = "s".repeat(32);
  const now = Date.UTC(2026, 8, 28, 6);

  it("grants exactly one request until it expires", () => {
    const token = signTrackToken("req123abc456", secret, now);
    expect(verifyTrackToken(token, secret, now)).toBe("req123abc456");
    expect(verifyTrackToken(token, secret, now + (TRACK_TTL_SECONDS + 1) * 1000)).toBeNull();
  });

  it("rejects tampering and other secrets", () => {
    const token = signTrackToken("req123abc456", secret, now);
    const [, exp, sig] = token.split(".");
    expect(verifyTrackToken(`req999abc456.${exp}.${sig}`, secret, now)).toBeNull();
    expect(verifyTrackToken(token, "x".repeat(32), now)).toBeNull();
    expect(verifyTrackToken(`${token}.extra`, secret, now)).toBeNull();
    expect(verifyTrackToken(undefined, secret, now)).toBeNull();
  });
});
