// Better Auth admin-plugin access control. These statements guard the plugin's HTTP endpoints
// (/api/auth/admin/*), which exist whether or not our UI uses them — so they must mirror D-09.
// Our own admin Server Actions use `permissions.ts` instead.
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
} as const;

export const ac = createAccessControl(statement);

// Impersonation is granted to nobody (not in MVP; it would bypass 2FA for the target).
export const authRoles = {
  user: ac.newRole({ user: [], session: [] }),
  operator: ac.newRole({ user: [], session: [] }),
  admin: ac.newRole({ user: ["list", "get", "ban"], session: ["list"] }),
  super_admin: ac.newRole({
    user: ["list", "get", "ban", "set-role", "set-password", "update"],
    session: ["list", "revoke"],
  }),
};
