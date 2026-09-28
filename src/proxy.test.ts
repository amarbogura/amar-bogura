const { getSessionCookie } = vi.hoisted(() => ({ getSessionCookie: vi.fn() }));
vi.mock("better-auth/cookies", () => ({ getSessionCookie }));

import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

const request = (path: string, init: { cookie?: string; method?: string } = {}) =>
  new NextRequest(new URL(path, "https://amarbogura.test"), {
    method: init.method ?? "GET",
    headers: init.cookie ? { cookie: init.cookie } : {},
  });

const location = (response: Response) => {
  const value = response.headers.get("location");
  return value ? new URL(value).pathname + new URL(value).search : null;
};
const rewrite = (response: Response) => {
  const value = response.headers.get("x-middleware-rewrite");
  return value ? new URL(value).pathname + new URL(value).search : null;
};

beforeEach(() => getSessionCookie.mockReturnValue(null));

describe("proxy — languages (D-17)", () => {
  it("rewrites unprefixed Bangla URLs to the internal /bn segment", () => {
    expect(rewrite(proxy(request("/")))).toBe("/bn");
    expect(rewrite(proxy(request("/services/ac-repair?x=1")))).toBe("/bn/services/ac-repair?x=1");
  });

  it("passes English URLs through untouched", () => {
    const response = proxy(request("/en/services/ac-repair"));
    expect(rewrite(response)).toBeNull();
    expect(location(response)).toBeNull();
  });

  it("redirects a public /bn/… URL to its one canonical unprefixed URL", () => {
    const response = proxy(request("/bn/track?code=AB"));
    expect(response.status).toBe(308);
    expect(location(response)).toBe("/track?code=AB");
  });

  it("sends a remembered English choice from /… to /en/…", () => {
    expect(location(proxy(request("/services/x", { cookie: "ab_locale=en" })))).toBe(
      "/en/services/x",
    );
    expect(rewrite(proxy(request("/services/x", { cookie: "ab_locale=bn" })))).toBe(
      "/bn/services/x",
    );
  });

  it("never redirects form posts (Server Actions) on the cookie", () => {
    const response = proxy(request("/track", { cookie: "ab_locale=en", method: "POST" }));
    expect(location(response)).toBeNull();
    expect(rewrite(response)).toBe("/bn/track");
  });
});

describe("proxy — optimistic auth, per language", () => {
  it("sends logged-out visitors to the login page in their language", () => {
    expect(location(proxy(request("/account/requests")))).toBe("/login?next=%2Faccount%2Frequests");
    expect(location(proxy(request("/en/account")))).toBe("/en/login?next=%2Faccount");
  });

  it("sends logged-out admins to the admin login in their language", () => {
    expect(location(proxy(request("/admin")))).toBe("/admin/login");
    expect(location(proxy(request("/en/admin/users")))).toBe("/en/admin/login");
    expect(rewrite(proxy(request("/admin/login")))).toBe("/bn/admin/login");
  });

  it("lets a session cookie through (layouts do the real check)", () => {
    getSessionCookie.mockReturnValue("token");
    expect(rewrite(proxy(request("/account")))).toBe("/bn/account");
    expect(location(proxy(request("/en/account")))).toBeNull();
  });
});

describe("proxy matcher", () => {
  const matcher = new RegExp(`^${config.matcher[0]!.replace("/(", "/(")}$`);
  it("skips API routes, Next internals and files", () => {
    expect(matcher.test("/api/auth/session")).toBe(false);
    expect(matcher.test("/_next/static/x.js")).toBe(false);
    expect(matcher.test("/icon.svg")).toBe(false);
    expect(matcher.test("/services/ac-repair")).toBe(true);
    expect(matcher.test("/en")).toBe(true);
  });
});
