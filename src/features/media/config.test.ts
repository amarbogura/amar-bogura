import {
  buildPublicId,
  isAllowedFormat,
  ownsPublicId,
  uploaderKey,
  uploadPermission,
} from "./config";

const user = { kind: "user", id: "user123" } as const;
const guest = { kind: "guest", key: "gkeyABC" } as const;

describe("public ids", () => {
  it("are namespaced by env, purpose folder and uploader", () => {
    expect(buildPublicId("REQUEST", "production", user, "r4nd0m")).toBe(
      "amar-bogura/production/requests/u_user123/r4nd0m",
    );
    expect(buildPublicId("LISTING", "development", guest, "x")).toBe(
      "amar-bogura/development/listings/g_gkeyABC/x",
    );
    expect(uploaderKey(guest)).toBe("g_gkeyABC");
  });

  it("belong only to their uploader, purpose and environment", () => {
    const id = buildPublicId("REQUEST", "production", user, "abc_DEF-123");
    expect(ownsPublicId(id, "REQUEST", "production", user)).toBe(true);
    expect(ownsPublicId(id, "REQUEST", "production", { kind: "user", id: "other" })).toBe(false);
    expect(ownsPublicId(id, "REQUEST", "production", guest)).toBe(false);
    expect(ownsPublicId(id, "LISTING", "production", user)).toBe(false);
    expect(ownsPublicId(id, "REQUEST", "development", user)).toBe(false);
  });

  it.each([
    "amar-bogura/production/requests/u_user123/../u_victim/abc",
    "amar-bogura/production/requests/u_user123/a/b",
    "amar-bogura/production/requests/u_user123/",
    "amar-bogura/production/requests/u_user1234/abc",
    "amar-bogura/production/requests/u_user123/abc.jpg",
  ])("rejects path tricks: %s", (id) => {
    expect(ownsPublicId(id, "REQUEST", "production", user)).toBe(false);
  });
});

describe("uploadPermission", () => {
  it("lets guests upload request photos only", () => {
    expect(uploadPermission("REQUEST", "guest")).toBe("ok");
    expect(uploadPermission("LISTING", "guest")).toBe("login_required");
    expect(uploadPermission("AVATAR", "guest")).toBe("login_required");
    expect(uploadPermission("CMS", "guest")).toBe("login_required");
  });

  it("reserves CMS uploads for admins", () => {
    expect(uploadPermission("CMS", "user")).toBe("forbidden");
    expect(uploadPermission("CMS", "admin")).toBe("ok");
    expect(uploadPermission("LISTING", "user")).toBe("ok");
  });
});

describe("isAllowedFormat", () => {
  it.each(["jpg", "JPEG", "png", "webp", "heic", "heif"])("allows %s", (format) => {
    expect(isAllowedFormat(format)).toBe(true);
  });
  it.each(["pdf", "gif", "svg", "mp4", "", undefined])("rejects %s", (format) => {
    expect(isAllowedFormat(format)).toBe(false);
  });
});
