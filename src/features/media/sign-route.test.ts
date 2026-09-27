const { getSession, cookieJar, rateLimit, signUpload } = vi.hoisted(() => ({
  getSession: vi.fn(),
  cookieJar: new Map<string, string>(),
  rateLimit: vi.fn(async () => ({ success: true, retryAfter: 0 })),
  signUpload: vi.fn(() => "signed"),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "s".repeat(32), NODE_ENV: "test" } }));
vi.mock("@/lib/session", () => ({ getSession }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/features/media/cloudinary", () => ({
  signUpload,
  cloudName: () => "demo",
  apiKey: () => "key",
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.9" }),
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
  }),
}));

import { POST } from "@/app/api/uploads/sign/route";

const call = (purpose: unknown) =>
  POST(
    new Request("http://x/api/uploads/sign", { method: "POST", body: JSON.stringify({ purpose }) }),
  );

const session = (user: Record<string, unknown>) => ({
  user: { id: "u1", role: "user", banned: false, twoFactorEnabled: false, ...user },
});

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
  getSession.mockResolvedValue(null);
});

describe("POST /api/uploads/sign", () => {
  it("rejects an unknown purpose", async () => {
    expect((await call("SELFIE")).status).toBe(400);
  });

  it("asks guests to log in for listing photos", async () => {
    expect((await call("LISTING")).status).toBe(401);
    expect(signUpload).not.toHaveBeenCalled();
  });

  it("forbids CMS uploads for normal users", async () => {
    getSession.mockResolvedValue(session({}));
    expect((await call("CMS")).status).toBe(403);
  });

  it("allows CMS uploads for admins with 2FA", async () => {
    getSession.mockResolvedValue(session({ id: "a1", role: "admin", twoFactorEnabled: true }));
    const response = await call("CMS");
    expect(response.status).toBe(200);
    expect((await response.json()).public_id).toMatch(/^amar-bogura\/test\/cms\/u_a1\//);
  });

  it("gives a guest a signed cookie and a guest-bound public id for request photos", async () => {
    const response = await call("REQUEST");
    expect(response.status).toBe(200);
    expect(cookieJar.get("ab_guest")).toMatch(/^[\w-]+\.[\w-]+$/);
    const body = await response.json();
    expect(body).toMatchObject({
      cloudName: "demo",
      apiKey: "key",
      signature: "signed",
      tags: "temp",
      allowed_formats: "jpg,jpeg,png,webp,heic,heif",
    });
    expect(body.public_id).toMatch(/^amar-bogura\/test\/requests\/g_[A-Za-z0-9_]{24}\/[\w-]+$/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    // The exact params returned are the ones signed.
    expect(signUpload).toHaveBeenCalledWith({
      allowed_formats: body.allowed_formats,
      eager: body.eager,
      public_id: body.public_id,
      tags: "temp",
      timestamp: body.timestamp,
    });
  });

  it("reuses the same guest key on the next request", async () => {
    const first = await (await call("REQUEST")).json();
    const second = await (await call("REQUEST")).json();
    const prefix = (id: string) => id.split("/").slice(0, 4).join("/");
    expect(prefix(second.public_id)).toBe(prefix(first.public_id));
  });

  it("returns 429 when rate limited", async () => {
    rateLimit.mockResolvedValueOnce({ success: false, retryAfter: 60 });
    expect((await call("REQUEST")).status).toBe(429);
    expect(signUpload).not.toHaveBeenCalled();
  });
});
