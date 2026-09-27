import { type FormatContext, formatValue } from "../format-value";
import { bn, hasValue } from "../schema-utils";
import type { FormField, FormSchema } from "../types";

/**
 * Read-only render of stored answers (docs/03 §3.6). Always pass the schema of the STORED
 * formVersion, never the current one, so old requests keep their original labels.
 */
export function DetailsView({
  schema,
  details,
  extraFields = [],
  extraValues = {},
  ...ctx
}: {
  schema: FormSchema;
  details: Record<string, unknown>;
  /** e.g. common fields shown after the details (review step, admin view). */
  extraFields?: FormField[];
  extraValues?: Record<string, unknown>;
} & FormatContext) {
  const groups = [
    ...schema.sections.map((section) => ({
      key: section.key,
      title: bn(section.title),
      rows: section.fields.map((field) => ({ field, value: details[field.key] })),
    })),
    ...(extraFields.length
      ? [
          {
            key: "__common",
            title: "যোগাযোগ ও ঠিকানা",
            rows: extraFields.map((field) => ({ field, value: extraValues[field.key] })),
          },
        ]
      : []),
  ]
    .map((group) => ({
      ...group,
      rows: group.rows
        .filter(
          ({ field, value }) => field.type !== "heading" && (hasValue(value) || value === false),
        )
        .map(({ field, value }) => ({ field, text: formatValue(field, value, ctx) }))
        .filter(({ text }) => text),
    }))
    .filter((group) => group.rows.length > 0);

  if (groups.length === 0)
    return <p className="text-sm text-muted-foreground">কোনো তথ্য দেওয়া হয়নি।</p>;

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.title}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{group.title}</h3>
          <dl className="divide-y rounded-lg border bg-card">
            {group.rows.map(({ field, text }) => (
              <div key={field.key} className="grid gap-1 px-3 py-2 sm:grid-cols-[12rem_1fr]">
                <dt className="text-sm text-muted-foreground">{bn(field.label)}</dt>
                <dd className="text-sm font-medium break-words">{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
