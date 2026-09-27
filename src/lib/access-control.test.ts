// Better Auth's admin endpoints (/api/auth/admin/*) are reachable over HTTP; this pins who may call them.
import { authRoles } from "./access-control";

const allowed = (
  role: keyof typeof authRoles,
  request: Parameters<(typeof authRoles)["user"]["authorize"]>[0],
) => authRoles[role].authorize(request).success;

describe("Better Auth admin access control", () => {
  it.each(["user", "operator"] as const)("%s cannot use any admin endpoint", (role) => {
    for (const action of [
      "list",
      "get",
      "ban",
      "set-role",
      "set-password",
      "delete",
      "create",
      "update",
    ] as const) {
      expect(allowed(role, { user: [action] }), action).toBe(false);
    }
    expect(allowed(role, { session: ["list"] })).toBe(false);
    expect(allowed(role, { session: ["revoke"] })).toBe(false);
  });

  it("admin may list, view and ban users but not change roles or passwords", () => {
    expect(allowed("admin", { user: ["list", "get", "ban"] })).toBe(true);
    expect(allowed("admin", { user: ["set-role"] })).toBe(false);
    expect(allowed("admin", { user: ["set-password"] })).toBe(false);
    expect(allowed("admin", { session: ["revoke"] })).toBe(false);
  });

  it("super_admin may change roles and revoke sessions", () => {
    expect(allowed("super_admin", { user: ["set-role", "set-password"] })).toBe(true);
    expect(allowed("super_admin", { session: ["revoke"] })).toBe(true);
  });

  it.each(Object.keys(authRoles) as Array<keyof typeof authRoles>)(
    "%s cannot impersonate or delete users",
    (role) => {
      expect(allowed(role, { user: ["impersonate"] })).toBe(false);
      expect(allowed(role, { user: ["impersonate-admins"] })).toBe(false);
      expect(allowed(role, { user: ["delete"] })).toBe(false);
    },
  );
});
