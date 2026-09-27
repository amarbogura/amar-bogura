vi.mock("server-only", () => ({}));

import { claimMedia, MediaClaimError } from "./claim";

const tx = () => ({ mediaAsset: { findMany: vi.fn(), updateMany: vi.fn() } });
const user = { kind: "user", id: "u1" } as const;
const guest = { kind: "guest", key: "gk" } as const;

describe("claimMedia", () => {
  it("attaches TEMP media owned by the user", async () => {
    const client = tx();
    client.mediaAsset.findMany.mockResolvedValue([
      { id: "a", publicId: "p/a" },
      { id: "b", publicId: "p/b" },
    ]);
    client.mediaAsset.updateMany.mockResolvedValue({ count: 2 });
    await expect(
      claimMedia(client as never, {
        ids: ["a", "b", "a"],
        owner: user,
        purpose: "LISTING",
        max: 8,
      }),
    ).resolves.toEqual(["p/a", "p/b"]);
    expect(client.mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["a", "b"] }, status: "TEMP", purpose: "LISTING", uploadedById: "u1" },
      }),
    );
  });

  it("scopes guests to their key and to guest-only uploads", async () => {
    const client = tx();
    client.mediaAsset.findMany.mockResolvedValue([{ id: "a", publicId: "p/a" }]);
    client.mediaAsset.updateMany.mockResolvedValue({ count: 1 });
    await claimMedia(client as never, { ids: ["a"], owner: guest, purpose: "REQUEST", max: 5 });
    expect(client.mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ guestKey: "gk", uploadedById: null }),
      }),
    );
  });

  it("attaches nothing if any id is foreign, attached or of another purpose", async () => {
    const client = tx();
    client.mediaAsset.findMany.mockResolvedValue([{ id: "a", publicId: "p/a" }]);
    await expect(
      claimMedia(client as never, {
        ids: ["a", "stolen"],
        owner: user,
        purpose: "LISTING",
        max: 8,
      }),
    ).rejects.toBeInstanceOf(MediaClaimError);
    expect(client.mediaAsset.updateMany).not.toHaveBeenCalled();
  });

  it("enforces the maximum count", async () => {
    const client = tx();
    await expect(
      claimMedia(client as never, {
        ids: ["a", "b", "c"],
        owner: user,
        purpose: "REQUEST",
        max: 2,
      }),
    ).rejects.toThrow("Too many images");
    expect(client.mediaAsset.findMany).not.toHaveBeenCalled();
  });

  it("fails if a concurrent claim won the race", async () => {
    const client = tx();
    client.mediaAsset.findMany.mockResolvedValue([{ id: "a", publicId: "p/a" }]);
    client.mediaAsset.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      claimMedia(client as never, { ids: ["a"], owner: user, purpose: "LISTING", max: 8 }),
    ).rejects.toBeInstanceOf(MediaClaimError);
  });

  it("is a no-op for no ids", async () => {
    const client = tx();
    await expect(
      claimMedia(client as never, { ids: [], owner: user, purpose: "LISTING", max: 8 }),
    ).resolves.toEqual([]);
  });
});
