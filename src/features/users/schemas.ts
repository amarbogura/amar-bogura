import { z } from "zod";

import { ROLES } from "@/lib/permissions";

export const setUserRoleSchema = z.object({
  userId: z.string().min(1).max(64),
  role: z.enum(ROLES, { error: "সঠিক ভূমিকা বেছে নিন।" }),
});
export type SetUserRoleInput = z.input<typeof setUserRoleSchema>;
