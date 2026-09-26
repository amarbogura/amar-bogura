import { buildCsp, securityHeaders } from "./security-headers";

const headerMap = (isDev: boolean) =>
  Object.fromEntries(securityHeaders(isDev).map(({ key, value }) => [key, value]));

describe("buildCsp", () => {
  it("locks down framing, objects, base-uri and form targets", () => {
    const csp = buildCsp(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows Cloudinary images and Turnstile", () => {
    const csp = buildCsp(false);
    expect(csp).toMatch(/img-src [^;]*https:\/\/res\.cloudinary\.com/);
    expect(csp).toMatch(/frame-src [^;]*https:\/\/challenges\.cloudflare\.com/);
  });

  it("only allows unsafe-eval and websockets in development", () => {
    expect(buildCsp(false)).not.toContain("'unsafe-eval'");
    expect(buildCsp(false)).not.toContain("ws:");
    expect(buildCsp(true)).toContain("'unsafe-eval'");
    expect(buildCsp(true)).toContain("ws:");
    expect(buildCsp(true)).not.toContain("upgrade-insecure-requests");
  });
});

describe("securityHeaders", () => {
  it("sets the baseline headers", () => {
    const headers = headerMap(false);
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
  });

  it("sends HSTS in production only", () => {
    expect(headerMap(false)["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headerMap(true)["Strict-Transport-Security"]).toBeUndefined();
  });
});
