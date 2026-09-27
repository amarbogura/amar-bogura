const { listTempImagesBefore, destroyImages, mediaAsset, env } = vi.hoisted(() => ({
  listTempImagesBefore: vi.fn(),
  destroyImages: vi.fn(),
  mediaAsset: { findMany: vi.fn(), deleteMany: vi.fn() },
  env: { CRON_SECRET: "c".repeat(40), NODE_ENV: "test" },
}));

vi.mock("@/env", () => ({ env }));
vi.mock("@/lib/db", () => ({ db: { mediaAsset } }));
vi.mock("@/features/media/cloudinary", () => ({ listTempImagesBefore, destroyImages }));

import { GET } from "@/app/api/cron/cleanup-media/route";

const call = (auth?: string, query = "") =>
  GET(
    new Request(`http://x/api/cron/cleanup-media${query}`, {
      headers: auth ? { authorization: auth } : {},
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  env.NODE_ENV = "test";
  listTempImagesBefore.mockResolvedValue(["p/old1", "p/old2", "p/attached"]);
  mediaAsset.findMany.mockResolvedValue([{ publicId: "p/attached" }]);
  mediaAsset.deleteMany.mockResolvedValue({ count: 2 });
});

describe("GET /api/cron/cleanup-media", () => {
  it.each([undefined, "Bearer wrong", `Bearer ${"c".repeat(39)}`, "c".repeat(40)])(
    "rejects missing/wrong secret %s",
    async (auth) => {
      expect((await call(auth)).status).toBe(401);
      expect(listTempImagesBefore).not.toHaveBeenCalled();
    },
  );

  it("deletes old temp uploads but never attached ones, then old TEMP rows", async () => {
    const response = await call(`Bearer ${env.CRON_SECRET}`);
    expect(response.status).toBe(200);
    expect(destroyImages).toHaveBeenCalledWith(["p/old1", "p/old2"]);
    expect(mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: {
        status: "TEMP",
        createdAt: { lt: expect.any(Date) },
        publicId: { startsWith: "amar-bogura/test/" },
      },
    });
    await expect(response.json()).resolves.toEqual({
      cloudinaryDeleted: 2,
      skippedAttached: 1,
      rowsDeleted: 2,
      maxAgeHours: 24,
    });
  });

  it("uses a 24h cutoff", async () => {
    const before = Date.now();
    await call(`Bearer ${env.CRON_SECRET}`);
    const cutoff = (listTempImagesBefore.mock.calls[0]![0] as Date).getTime();
    expect(before - cutoff).toBeGreaterThanOrEqual(24 * 3600 * 1000 - 1000);
    expect(listTempImagesBefore.mock.calls[0]![1]).toBe("amar-bogura/test/");
  });

  it("ignores the maxAgeHours test hook in production", async () => {
    env.NODE_ENV = "production";
    await expect(
      (await call(`Bearer ${env.CRON_SECRET}`, "?maxAgeHours=0")).json(),
    ).resolves.toMatchObject({
      maxAgeHours: 24,
    });
  });
});
