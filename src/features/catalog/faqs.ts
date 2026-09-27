import { z } from "zod";

export interface Faq {
  q: string;
  a: string;
}

const faqSchema = z.object({ q: z.string().trim().min(1), a: z.string().trim().min(1) });

/** FAQs are admin-edited JSON (`[{ q, a }]`); keep valid entries, drop anything malformed. */
export function parseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = faqSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
