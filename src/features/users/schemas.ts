import { z } from "zod";

import type { T } from "@/i18n/server";
import { ROLES } from "@/lib/permissions";

export const setUserRoleSchema = (t: T) =>
  z.object({
    userId: z.string().min(1).max(64),
    role: z.enum(ROLES, { error: t("admin.errors.role") }),
  });
export type SetUserRoleInput = z.input<ReturnType<typeof setUserRoleSchema>>;
