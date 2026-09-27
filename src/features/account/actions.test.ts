const { getAuthSession, area, user, rateLimit } = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  area: { findFirst: vi.fn() },
  user: { update: vi.fn() },
  rateLimit: vi.fn(async () => ({ success: true, retryAfter: 0 })),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "s".repeat(32) } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: getAuthSession } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/db", () => ({ db: { area, user } }));

import { updateProfile } from "./actions";

const loggedIn = { user: { id: "u1", role: "user" }, session: { id: "s1" } };

beforeEach(() => {
  vi.clearAllMocks();
  getAuthSession.mockResolvedValue(loggedIn);
});

describe("updateProfile", () => {
  it("requires login", async () => {
    getAuthSession.mockResolvedValue(null);
    await expect(updateProfile({ name: "রহিম" })).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    expect(user.update).not.toHaveBeenCalled();
  });

  it("is rate limited", async () => {
    rateLimit.mockResolvedValueOnce({ success: false, retryAfter: 30 });
    await expect(updateProfile({ name: "রহিম" })).resolves.toMatchObject({
      ok: false,
      status: 429,
    });
  });

  it("rejects markup in the name", async () => {
    await expect(updateProfile({ name: "<script>x</script>" })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    expect(user.update).not.toHaveBeenCalled();
  });

  it("rejects an unknown or inactive area", async () => {
    area.findFirst.mockResolvedValue(null);
    await expect(updateProfile({ name: "রহিম", areaId: "nope" })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    expect(user.update).not.toHaveBeenCalled();
  });

  it("updates only the caller's own name and area", async () => {
    area.findFirst.mockResolvedValue({ id: "a1" });
    await expect(updateProfile({ name: "  রহিম উদ্দিন ", areaId: "a1" })).resolves.toEqual({
      ok: true,
      data: { name: "রহিম উদ্দিন", areaId: "a1" },
    });
    expect(user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "রহিম উদ্দিন", areaId: "a1" },
    });
  });

  it("clears the area when empty", async () => {
    await updateProfile({ name: "রহিম", areaId: "" });
    expect(user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "রহিম", areaId: null },
    });
  });
});
