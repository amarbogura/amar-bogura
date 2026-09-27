import { ADMIN_ROLES, can, isAdminRole, type Permission, PERMISSIONS, ROLES } from "./permissions";

// D-09 matrix: operator (requests + listings) ⊂ admin (+ catalog, CMS, users) ⊂ super_admin
// (+ admins, settings, audit). Written out explicitly so any change to the map is deliberate.
const expected: Record<string, Permission[]> = {
  user: [],
  operator: ["requests.manage", "listings.moderate"],
  admin: ["requests.manage", "listings.moderate", "catalog.manage", "cms.manage", "users.manage"],
  super_admin: [...PERMISSIONS],
};

describe("permission map (D-09)", () => {
  it.each(ROLES.flatMap((role) => PERMISSIONS.map((permission) => [role, permission] as const)))(
    "%s → %s",
    (role, permission) => {
      expect(can(role, permission)).toBe(expected[role]!.includes(permission));
    },
  );

  it("grants nothing to unknown roles", () => {
    for (const role of [undefined, null, "", "root", "Admin", 1]) {
      for (const permission of PERMISSIONS) expect(can(role, permission)).toBe(false);
    }
  });

  it("identifies admin roles", () => {
    expect(ADMIN_ROLES).toEqual(["operator", "admin", "super_admin"]);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(false);
  });
});
