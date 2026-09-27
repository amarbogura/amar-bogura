import { z } from "zod";

/** Plain text only: rejects anything that looks like markup (CLAUDE.md: no raw HTML from users). */
const plainText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} কমপক্ষে ${min} অক্ষরের হতে হবে।`)
    .max(max, `${label} সর্বোচ্চ ${max} অক্ষরের হতে পারে।`)
    .refine((value) => !/[<>]/.test(value), `${label}-এ < বা > চিহ্ন ব্যবহার করা যাবে না।`);

export const updateProfileSchema = z.object({
  name: plainText("নাম", 2, 60),
  areaId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((value) => value || null),
});
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
