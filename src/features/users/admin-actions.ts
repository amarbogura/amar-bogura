"use server";

import { adminAction, fail, ok } from "@/lib/action";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

import { setUserRoleSchema } from "./schemas";

/**
 * D-09: only SUPER_ADMIN changes roles. Promotion to an admin role requires the target to already
 * have an email+password account (admins log in only with email + password + TOTP). The target's
 * sessions are revoked so the new role applies immediately.
 */
export const setUserRole = adminAction(
  "admins.manage",
  setUserRoleSchema,
  async ({ userId, role }, { session, ipHash }) => {
    if (userId === session.user.id) return fail(409, "নিজের ভূমিকা নিজে পরিবর্তন করা যাবে না।");

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accounts: { select: { providerId: true } } },
    });
    if (!target) return fail(404, "ব্যবহারকারী খুঁজে পাওয়া যায়নি।");
    if (target.role === role) return ok({ userId, role });

    const hasPassword = target.accounts.some((account) => account.providerId === "credential");
    if (isAdminRole(role) && !hasPassword) {
      return fail(409, "অ্যাডমিন করতে হলে আগে ইমেইল ও পাসওয়ার্ড সেট করতে হবে।");
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role } });
      await tx.session.deleteMany({ where: { userId } });
      await writeAuditLog(tx, {
        actorId: session.user.id,
        action: "user.set_role",
        entityType: "User",
        entityId: userId,
        before: { role: target.role },
        after: { role },
        ipHash,
      });
    });
    return ok({ userId, role });
  },
);
