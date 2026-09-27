const { limit, slidingWindow, created } = vi.hoisted(() => ({
  limit: vi.fn(),
  slidingWindow: vi.fn((tokens: number, window: string) => ({ tokens, window })),
  created: [] as Array<{ prefix: string; limiter: unknown }>,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" },
}));
vi.mock("@upstash/redis", () => ({ Redis: vi.fn() }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = slidingWindow;
    limit = limit;
    constructor(options: { prefix: string; limiter: unknown }) {
      created.push(options);
    }
  }
  return { Ratelimit };
});

import { RATE_LIMIT_POLICIES, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => limit.mockReset());

  it("uses the policy's window and a namespaced prefix", async () => {
    limit.mockResolvedValue({ success: true, reset: Date.now() + 1000 });
    await rateLimit("otpSendPhone", "+8801712345678");
    expect(created.at(-1)).toMatchObject({
      prefix: "rl:otpSendPhone",
      limiter: { tokens: 3, window: "10 m" },
    });
    expect(limit).toHaveBeenCalledWith("+8801712345678");
  });

  it("reuses one limiter per policy", async () => {
    limit.mockResolvedValue({ success: true, reset: 0 });
    const before = created.length;
    await rateLimit("adminLogin", "a");
    await rateLimit("adminLogin", "b");
    expect(created.length - before).toBe(1);
  });

  it("reports how long to wait when denied", async () => {
    limit.mockResolvedValue({ success: false, reset: Date.now() + 90_000 });
    const result = await rateLimit("otpSendIp", "1.2.3.4");
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBeGreaterThanOrEqual(89);
  });

  it("matches the limits in docs/04 P2", () => {
    expect(RATE_LIMIT_POLICIES.otpSendPhone).toEqual({ limit: 3, window: "10 m" });
    expect(RATE_LIMIT_POLICIES.otpSendIp).toEqual({ limit: 10, window: "1 h" });
    expect(RATE_LIMIT_POLICIES.adminLogin).toEqual({ limit: 5, window: "15 m" });
  });
});
