import { z } from "zod";

import type { T } from "@/i18n/server";

/** Plain text only: rejects anything that looks like markup (CLAUDE.md: no raw HTML from users). */
const plainText = (t: T, label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, t("account.textMin", { label, min }))
    .max(max, t("account.textMax", { label, max }))
    .refine((value) => !/[<>]/.test(value), t("account.textAngle", { label }));

/** Built per request so messages are in the caller's language. */
export const updateProfileSchema = (t: T) =>
  z.object({
    name: plainText(t, t("account.name"), 2, 60),
    areaId: z
      .string()
      .trim()
      .max(64)
      .optional()
      .transform((value) => value || null),
  });
export type UpdateProfileInput = z.input<ReturnType<typeof updateProfileSchema>>;
