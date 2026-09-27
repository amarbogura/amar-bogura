import { guestKeyFor, newGuestId, signGuestId, verifyGuestCookie } from "./guest-token";

const SECRET = "s".repeat(32);

describe("guest cookie", () => {
  it("round-trips a signed id", () => {
    const id = newGuestId();
    expect(verifyGuestCookie(signGuestId(id, SECRET), SECRET)).toBe(id);
  });

  it("rejects tampering, other secrets and junk", () => {
    const id = newGuestId();
    const cookie = signGuestId(id, SECRET);
    const [, signature] = cookie.split(".");
    expect(verifyGuestCookie(`${newGuestId()}.${signature}`, SECRET)).toBeNull();
    expect(verifyGuestCookie(cookie, "x".repeat(32))).toBeNull();
    expect(verifyGuestCookie(`${cookie}.extra`, SECRET)).toBeNull();
    for (const junk of [undefined, "", "abc", "a.b", "../../etc.x"]) {
      expect(verifyGuestCookie(junk, SECRET)).toBeNull();
    }
  });

  it("derives a stable, path-safe key that is not the raw id", () => {
    const id = newGuestId();
    const key = guestKeyFor(id);
    expect(key).toBe(guestKeyFor(id));
    expect(key).not.toContain(id);
    expect(key).toMatch(/^[A-Za-z0-9_]{24}$/);
  });
});
