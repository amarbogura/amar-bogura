const { resolveUploader, getStoredImage, destroyImages, mediaAsset, rateLimit } = vi.hoisted(
  () => ({
    resolveUploader: vi.fn(),
    getStoredImage: vi.fn(),
    destroyImages: vi.fn(),
    mediaAsset: { findUnique: vi.fn(), create: vi.fn() },
    rateLimit: vi.fn(async () => ({ success: true, retryAfter: 0 })),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test", BETTER_AUTH_SECRET: "s".repeat(32) } }));
vi.mock("@/lib/db", () => ({ db: { mediaAsset } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("./uploader", () => ({ resolveUploader }));
vi.mock("./cloudinary", () => ({ getStoredImage, destroyImages }));

import { registerMedia } from "./actions";

const OWN = "amar-bogura/test/requests/g_guestKEY/abc123";
const stored = (overrides: Record<string, unknown> = {}) => ({
  publicId: OWN,
  resourceType: "image",
  format: "jpg",
  bytes: 800_000,
  width: 1600,
  height: 1200,
  secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/${OWN}.jpg`,
  createdAt: new Date(),
  tags: ["temp"],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  resolveUploader.mockResolvedValue({ ok: true, uploader: { kind: "guest", key: "guestKEY" } });
  mediaAsset.findUnique.mockResolvedValue(null);
  mediaAsset.create.mockImplementation(async ({ data }) => ({
    id: "m1",
    url: data.url,
    width: 1600,
    height: 1200,
  }));
});

describe("registerMedia", () => {
  it("refuses someone else's upload without touching Cloudinary", async () => {
    const result = await registerMedia({
      publicId: "amar-bogura/test/requests/g_OTHERkey/abc123",
      purpose: "REQUEST",
    });
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(getStoredImage).not.toHaveBeenCalled();
    expect(mediaAsset.create).not.toHaveBeenCalled();
  });

  it("passes through uploader errors (e.g. guest listing → 401)", async () => {
    resolveUploader.mockResolvedValue({ ok: false, status: 401, error: "লগইন" });
    await expect(registerMedia({ publicId: OWN, purpose: "LISTING" })).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("deletes and rejects an image over 5 MB (server-side check)", async () => {
    getStoredImage.mockResolvedValue(stored({ bytes: 7 * 1024 * 1024 }));
    await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    expect(destroyImages).toHaveBeenCalledWith([OWN]);
    expect(mediaAsset.create).not.toHaveBeenCalled();
  });

  it.each([{ format: "pdf" }, { format: "gif" }, { resourceType: "video", format: "mp4" }])(
    "deletes and rejects a disallowed file %o",
    async (overrides) => {
      getStoredImage.mockResolvedValue(stored(overrides));
      await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
        ok: false,
        status: 400,
      });
      expect(destroyImages).toHaveBeenCalledWith([OWN]);
    },
  );

  it("404s when Cloudinary has no such image", async () => {
    getStoredImage.mockResolvedValue(null);
    await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("records a valid guest upload as TEMP with the guest key", async () => {
    getStoredImage.mockResolvedValue(stored());
    await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
      ok: true,
      data: { id: "m1" },
    });
    expect(mediaAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicId: OWN,
          purpose: "REQUEST",
          status: "TEMP",
          guestKey: "guestKEY",
          uploadedById: null,
          bytes: 800_000,
        }),
      }),
    );
  });

  it("is idempotent for an already registered upload", async () => {
    mediaAsset.findUnique.mockResolvedValue({ id: "m1", url: "u", width: 1, height: 1 });
    await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
      ok: true,
      data: { id: "m1" },
    });
    expect(getStoredImage).not.toHaveBeenCalled();
  });

  it("is rate limited per uploader", async () => {
    rateLimit.mockResolvedValueOnce({ success: false, retryAfter: 30 });
    await expect(registerMedia({ publicId: OWN, purpose: "REQUEST" })).resolves.toMatchObject({
      ok: false,
      status: 429,
    });
  });
});
