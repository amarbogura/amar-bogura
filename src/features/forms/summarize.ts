// docs/03 §1 — one-line summary for admin lists / listing cards, from `summary: true` fields.
import { type FormatContext, formatValue } from "./format-value";
import { allFields } from "./schema-utils";
import type { FormSchema } from "./types";

export function summarize(
  schema: FormSchema,
  details: Record<string, unknown>,
  { max = 3, ...ctx }: FormatContext & { max?: number } = {},
): string {
  return allFields(schema)
    .filter((field) => field.summary && field.key in details)
    .map((field) => formatValue(field, details[field.key], ctx))
    .filter(Boolean)
    .slice(0, max)
    .join(" · ");
}
