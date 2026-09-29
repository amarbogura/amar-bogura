import {
  ADMIN_SESSION_PATHS,
  authTrustedOrigins,
  canCreateSession,
  isBlockedAuthPath,
  isTempEmail,
  isTempName,
  rateLimitChecksFor,
  tempEmailForPhone,
} from "./auth-policy";

describe("canCreateSession (admins: email + password + TOTP only)", () => {
  const bypassPaths = [
    "/phone-number/verify",
    "/callback/:id",
    "/sign-in/social",
    "/admin/impersonate-user",
  ];

  it.each(["operator", "admin", "super_admin"])("%s: only email and 2FA paths", (role) => {
    for (const path of ADMIN_SESSION_PATHS) expect(canCreateSession(role, path), path).toBe(true);
    for (const path of bypassPaths) expect(canCreateSession(role, path), path).toBe(false);
    expect(canCreateSession(role, undefined)).toBe(false);
  });

  it("does not restrict normal users", () => {
    for (const path of [...bypassPaths, "/sign-in/email", undefined]) {
      expect(canCreateSession("user", path)).toBe(true);
    }
  });
});

describe("blocked Better Auth endpoints", () => {
  it("blocks /update-user (phone number would be rewritable) and /change-email", () => {
    expect(isBlockedAuthPath("/update-user")).toBe(true);
    expect(isBlockedAuthPath("/change-email")).toBe(true);
    expect(isBlockedAuthPath("/phone-number/verify")).toBe(false);
  });
});

describe("rateLimitChecksFor", () => {
  it("limits OTP sending per phone and per IP", () => {
    expect(
      rateLimitChecksFor("/phone-number/send-otp", { phoneNumber: "+8801712345678" }, "1.2.3.4"),
    ).toEqual([
      { policy: "otpSendPhone", key: "+8801712345678" },
      { policy: "otpSendIp", key: "1.2.3.4" },
    ]);
  });

  it("still limits per IP when the phone is missing", () => {
    expect(rateLimitChecksFor("/phone-number/send-otp", {}, "1.2.3.4")).toEqual([
      { policy: "otpSendIp", key: "1.2.3.4" },
    ]);
  });

  it("limits OTP verification per IP", () => {
    expect(rateLimitChecksFor("/phone-number/verify", {}, "1.2.3.4")).toEqual([
      { policy: "otpVerifyIp", key: "1.2.3.4" },
    ]);
  });

  it("limits admin login per IP and per email (case-insensitive)", () => {
    expect(rateLimitChecksFor("/sign-in/email", { email: " Admin@X.com " }, "1.2.3.4")).toEqual([
      { policy: "adminLogin", key: "1.2.3.4" },
      { policy: "adminLogin", key: "email:admin@x.com" },
    ]);
  });

  it("limits TOTP and backup-code verification", () => {
    expect(rateLimitChecksFor("/two-factor/verify-totp", {}, "ip")).toEqual([
      { policy: "twoFactorVerify", key: "ip" },
    ]);
    expect(rateLimitChecksFor("/two-factor/verify-backup-code", {}, "ip")).toEqual([
      { policy: "twoFactorVerify", key: "ip" },
    ]);
  });

  it("does not limit unrelated endpoints", () => {
    expect(rateLimitChecksFor("/get-session", {}, "ip")).toEqual([]);
  });
});

describe("phone sign-up placeholders", () => {
  it("builds a non-routable placeholder email", () => {
    const email = tempEmailForPhone("+8801712345678");
    expect(email).toBe("8801712345678@phone.amarbogura.invalid");
    expect(isTempEmail(email)).toBe(true);
    expect(isTempEmail("rahim@gmail.com")).toBe(false);
  });

  it("detects the temporary name (the phone number)", () => {
    expect(isTempName("+8801712345678", "+8801712345678")).toBe(true);
    expect(isTempName("")).toBe(true);
    expect(isTempName("রহিম উদ্দিন", "+8801712345678")).toBe(false);
  });
});

describe("authTrustedOrigins", () => {
  it("trusts the site with and without www", () => {
    expect(
      authTrustedOrigins(["https://amarbogurabd.com", "https://www.amarbogurabd.com/"]),
    ).toEqual(["https://amarbogurabd.com", "https://www.amarbogurabd.com"]);
    expect(authTrustedOrigins(["https://www.amarbogurabd.com"])).toEqual([
      "https://www.amarbogurabd.com",
      "https://amarbogurabd.com",
    ]);
  });

  it("adds no www twin for localhost or IPs, and appends extras", () => {
    expect(
      authTrustedOrigins(
        ["http://localhost:3000", "http://127.0.0.1:3000"],
        " https://amar-bogura-git-main.vercel.app/ ,, ",
      ),
    ).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://amar-bogura-git-main.vercel.app",
    ]);
  });
});
