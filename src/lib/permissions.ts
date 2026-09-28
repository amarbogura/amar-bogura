// D-09: roles live on User.role; the permission map lives in code (this file).

export const ROLES = ["user", "operator", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ADMIN_ROLES = ["operator", "admin", "super_admin"] as const satisfies readonly Role[];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  "requests.manage", // request pipeline: view, status, notes, assign, spam
  "listings.moderate", // approve / reject / remove listings
  "catalog.manage", // categories, services, listing categories, form builder
  "cms.manage", // banners, home sections, pages
  "users.manage", // view users, ban / unban
  "admins.manage", // change roles (promote / demote admins)
  "settings.manage", // site settings: hotline, notify emails…
  "audit.view", // audit log viewer
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const OPERATOR: readonly Permission[] = ["requests.manage", "listings.moderate"];
const ADMIN: readonly Permission[] = [...OPERATOR, "catalog.manage", "cms.manage", "users.manage"];
const SUPER_ADMIN: readonly Permission[] = [
  ...ADMIN,
  "admins.manage",
  "settings.manage",
  "audit.view",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  user: [],
  operator: OPERATOR,
  admin: ADMIN,
  super_admin: SUPER_ADMIN,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

/** Unknown or missing roles have no permissions. */
export function can(role: unknown, permission: Permission): boolean {
  return isRole(role) && ROLE_PERMISSIONS[role].includes(permission);
}
