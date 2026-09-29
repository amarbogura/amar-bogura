"use server";

import { z } from "zod";

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
  async ({ userId, role }, { session, ipHash, t }) => {
    if (userId === session.user.id) return fail(409, t("admin.errors.selfRole"));

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accounts: { select: { providerId: true } } },
    });
    if (!target) return fail(404, t("admin.errors.userNotFound"));
    if (target.role === role) return ok({ userId, role });

    const hasPassword = target.accounts.some((account) => account.providerId === "credential");
    if (isAdminRole(role) && !hasPassword) {
      return fail(409, t("admin.errors.needCredentials"));
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

/**
 * Ban a customer (users.manage): sets `banned` + reason and deletes their sessions, so they are
 * logged out everywhere; Better Auth refuses new sessions for banned users. Admins must be demoted
 * first (and nobody can ban themselves). Requests and listings are kept.
 */
export const banUser = adminAction(
  "users.manage",
  z.object({ userId: z.string().min(1).max(64), reason: z.string().trim().min(3).max(200) }),
  async ({ userId, reason }, { session, t, audit }) => {
    if (userId === session.user.id) return fail(409, t("admin.errors.banSelf"), t);
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, banned: true },
    });
    if (!target) return fail(404, t("admin.errors.userNotFound"), t);
    if (isAdminRole(target.role)) return fail(409, t("admin.errors.banAdmin"), t);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { banned: true, banReason: reason, banExpires: null },
      });
      await tx.session.deleteMany({ where: { userId } });
      await audit(tx, {
        action: "user.ban",
        entityType: "User",
        entityId: userId,
        before: { banned: target.banned },
        after: { banned: true, reason },
      });
    });
    return ok({ userId });
  },
);

export const unbanUser = adminAction(
  "users.manage",
  z.object({ userId: z.string().min(1).max(64) }),
  async ({ userId }, { t, audit }) => {
    const target = await db.user.findUnique({ where: { id: userId }, select: { banned: true } });
    if (!target) return fail(404, t("admin.errors.userNotFound"), t);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { banned: false, banReason: null, banExpires: null },
      });
      await audit(tx, {
        action: "user.unban",
        entityType: "User",
        entityId: userId,
        before: { banned: target.banned },
        after: { banned: false },
      });
    });
    return ok({ userId });
  },
);
