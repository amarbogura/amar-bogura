vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { SMS_PROVIDER: "console", NODE_ENV: "test" } }));

import { ConsoleSms } from "./console";
import { getSmsProvider, otpMessage } from "./index";

describe("ConsoleSms", () => {
  it("logs the message outside production", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await new ConsoleSms("development").send({ to: "+8801712345678", text: "hi" });
    expect(warn).toHaveBeenCalledWith("[sms:console] → +8801712345678: hi");
    warn.mockRestore();
  });

  it("refuses to run in production (OTPs would never reach users)", async () => {
    await expect(
      new ConsoleSms("production").send({ to: "+8801712345678", text: "hi" }),
    ).rejects.toThrow(/cannot deliver SMS in production/);
  });
});

describe("sms module", () => {
  it("selects the configured provider", () => {
    expect(getSmsProvider().name).toBe("console");
  });

  it("writes the OTP in Bangla digits", () => {
    expect(otpMessage("482019")).toContain("৪৮২০১৯");
  });
});
