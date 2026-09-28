"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, userAction } from "@/lib/action";
import { db } from "@/lib/db";

import { updateProfileSchema } from "./schemas";

/** Profile edits (name, area). Phone changes only via OTP; Better Auth's /update-user is disabled. */
export const updateProfile = userAction(
  "profileUpdate",
  updateProfileSchema,
  async ({ name, areaId }, session, t) => {
    if (areaId) {
      const area = await db.area.findFirst({
        where: { id: areaId, isActive: true },
        select: { id: true },
      });
      if (!area) return fail(400, t("account.areaInvalid"));
    }
    await db.user.update({ where: { id: session.user.id }, data: { name, areaId } });
    revalidatePath("/account");
    return ok({ name, areaId });
  },
);
