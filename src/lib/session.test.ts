// checkAdmin is the single authorization decision behind requireAdmin / requireAdminPage.
// Each layer is asserted separately so removing any one of them fails a test.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { checkAdmin, type Session } from "./session";

const session = (user: Record<string, unknown>) =>
  ({
    user: { id: "u1", role: "user", banned: false, twoFactorEnabled: true, ...user },
    session: { id: "s1" },
  }) as unknown as Session;

describe("checkAdmin", () => {
  it("rejects guests with 401", () => {
    expect(checkAdmin(null, "requests.manage")).toEqual({
      ok: false,
      status: 401,
      reason: "no_session",
    });
  });

  it("rejects a normal user because of the role, even with 2FA and no permission argument", () => {
    expect(checkAdmin(session({ role: "user" }))).toEqual({
      ok: false,
      status: 403,
      reason: "not_admin",
    });
  });

  it.each([null, undefined, "", "root", "ADMIN", "super-admin"])("rejects role %j", (role) => {
    expect(checkAdmin(session({ role }))).toMatchObject({ status: 403, reason: "not_admin" });
  });

  it("rejects a banned admin", () => {
    expect(checkAdmin(session({ role: "super_admin", banned: true }))).toMatchObject({
      status: 403,
      reason: "not_admin",
    });
  });

  it("rejects an admin without 2FA", () => {
    expect(checkAdmin(session({ role: "admin", twoFactorEnabled: false }))).toMatchObject({
      status: 403,
      reason: "no_2fa",
    });
  });

  it("rejects an admin lacking the permission", () => {
    expect(checkAdmin(session({ role: "operator" }), "catalog.manage")).toMatchObject({
      status: 403,
      reason: "no_permission",
    });
  });

  it("allows an admin with 2FA and the permission", () => {
    expect(checkAdmin(session({ role: "admin" }), "catalog.manage")).toMatchObject({ ok: true });
    expect(checkAdmin(session({ role: "operator" }), "requests.manage")).toMatchObject({
      ok: true,
    });
  });
});
