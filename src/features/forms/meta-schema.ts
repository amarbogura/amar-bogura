// docs/03 §2 — validates templates themselves (seed, admin form builder in P12, /dev/forms).
import { z } from "zod";

import { fieldSchema } from "./field-zod";
import { allFields } from "./schema-utils";
import {
  CHOICE_FIELD_TYPES,
  type FieldType,
  type FormSchema,
  IMAGES_MAX_FILES,
  RESERVED_LISTING_KEYS,
  RESERVED_REQUEST_KEYS,
  type ServiceFormPresets,
} from "./types";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "money",
  "phone",
  "url",
  "select",
  "multiselect",
  "radio",
  "checkboxes",
  "boolean",
  "date",
  "time",
  "datetime",
  "daterange",
  "area",
  "address",
  "route",
  "person",
  "item_list",
  "images",
  "heading",
] as const satisfies readonly FieldType[];

const KEY = /^[a-z][a-zA-Z0-9]*$/;
const i18n = z.object({ bn: z.string().trim().min(1), en: z.string().optional() }).strict();
const commonMode = z.enum(["required", "optional", "hidden"]).optional();
const showIf = z
  .object({
    field: z.string().regex(KEY),
    op: z.enum(["eq", "neq", "in", "notIn", "truthy", "falsy"]),
    value: z
      .union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])
      .optional(),
  })
  .strict();

const fieldShape = z
  .object({
    key: z.string().regex(KEY, "keys must be camelCase"),
    type: z.enum(FIELD_TYPES),
    label: i18n,
    placeholder: i18n.optional(),
    help: i18n.optional(),
    required: z.boolean().optional(),
    options: z
      .array(z.object({ value: z.string().min(1).max(64), label: i18n }).strict())
      .optional(),
    defaultValue: z.unknown().optional(),
    validation: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(1).optional(),
        pattern: z.string().optional(),
        patternMessage: i18n.optional(),
        maxFiles: z.number().int().min(1).max(IMAGES_MAX_FILES).optional(),
        units: z.array(z.string().min(1)).min(1).optional(),
      })
      .strict()
      .optional(),
    showIf: z.union([showIf, z.array(showIf).min(1)]).optional(),
    width: z.enum(["full", "half"]).optional(),
    summary: z.boolean().optional(),
    filterable: z.boolean().optional(),
  })
  .strict();

const rule = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("requireOneOf"), fields: z.array(z.string()).min(2), message: i18n })
    .strict(),
  z
    .object({
      type: z.literal("after"),
      field: z.string(),
      than: z.string(),
      message: i18n.optional(),
    })
    .strict(),
]);

const structure = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.enum(["REQUEST", "LISTING"]),
    common: z
      .object({
        address: commonMode,
        preferredDate: commonMode,
        preferredTimeSlot: commonMode,
        notes: commonMode,
        photos: commonMode,
        altPhone: commonMode,
        title: commonMode,
      })
      .strict(),
    sections: z.array(
      z
        .object({
          key: z.string().regex(KEY),
          title: i18n,
          description: i18n.optional(),
          fields: z.array(fieldShape),
        })
        .strict(),
    ),
    submitLabel: i18n.optional(),
    notice: i18n.optional(),
    rules: z.array(rule).optional(),
  })
  .strict();

const isChoice = (type: string) => (CHOICE_FIELD_TYPES as readonly string[]).includes(type);

/** Zod meta-schema: structure + the cross-field invariants of docs/03 §2. */
export const formSchemaSchema = structure.superRefine((schema, ctx) => {
  const issue = (message: string, path: (string | number)[]) =>
    ctx.addIssue({ code: "custom", message, path });
  const reserved: readonly string[] =
    schema.kind === "REQUEST" ? RESERVED_REQUEST_KEYS : RESERVED_LISTING_KEYS;
  const sectionKeys = new Set<string>();
  const seen = new Map<string, (typeof schema.sections)[number]["fields"][number]>();
  const probe = { mode: "client" as const, now: new Date("2000-01-01T00:00:00Z") };

  schema.sections.forEach((section, s) => {
    if (sectionKeys.has(section.key))
      issue(`duplicate section key "${section.key}"`, ["sections", s, "key"]);
    sectionKeys.add(section.key);

    section.fields.forEach((field, f) => {
      const path = ["sections", s, "fields", f];
      if (seen.has(field.key)) issue(`duplicate field key "${field.key}"`, [...path, "key"]);
      if (reserved.includes(field.key))
        issue(`"${field.key}" is reserved for a ${schema.kind} column`, [...path, "key"]);

      if (isChoice(field.type)) {
        const values = (field.options ?? []).map((option) => option.value);
        if (values.length === 0)
          issue(`${field.type} "${field.key}" needs options`, [...path, "options"]);
        if (new Set(values).size !== values.length)
          issue(`"${field.key}" has duplicate option values`, [...path, "options"]);
      } else if (field.options) {
        issue(`${field.type} "${field.key}" must not have options`, [...path, "options"]);
      }
      if (field.type === "item_list" && !field.validation?.units?.length) {
        issue(`item_list "${field.key}" needs validation.units`, [...path, "validation"]);
      }
      if (field.type === "images" && !field.validation?.maxFiles) {
        issue(`images "${field.key}" needs validation.maxFiles`, [...path, "validation"]);
      }
      if (field.filterable && schema.kind !== "LISTING")
        issue(`only LISTING fields can be filterable`, [...path, "filterable"]);
      if (field.type === "heading" && (field.required || field.defaultValue !== undefined)) {
        issue(`heading "${field.key}" holds no value`, path);
      }

      for (const [r, cond] of (field.showIf ? [field.showIf].flat() : []).entries()) {
        const target = seen.get(cond.field);
        const condPath = [...path, "showIf", ...(Array.isArray(field.showIf) ? [r] : [])];
        if (!target) {
          issue(
            `showIf on "${field.key}" must reference an EARLIER field ("${cond.field}")`,
            condPath,
          );
          continue;
        }
        if (target.options && cond.value !== undefined) {
          const allowed = target.options.map((option) => option.value);
          for (const value of [cond.value].flat()) {
            if (!allowed.includes(String(value)))
              issue(`showIf value "${value}" is not an option of "${cond.field}"`, condPath);
          }
        }
        if (["eq", "neq", "in", "notIn"].includes(cond.op) && cond.value === undefined) {
          issue(`showIf op "${cond.op}" needs a value`, condPath);
        }
      }

      if (field.defaultValue !== undefined && field.type !== "heading") {
        const typeOnly = {
          ...field,
          required: false,
          validation: { ...field.validation, min: undefined, max: undefined },
        };
        const valid =
          ["date", "datetime", "daterange"].includes(field.type) ||
          fieldSchema(typeOnly as never, probe).safeParse(field.defaultValue).success;
        if (!valid)
          issue(`defaultValue of "${field.key}" does not match its type`, [
            ...path,
            "defaultValue",
          ]);
      }
      seen.set(field.key, field);
    });
  });

  for (const [r, item] of (schema.rules ?? []).entries()) {
    const keys = item.type === "requireOneOf" ? item.fields : [item.field, item.than];
    for (const key of keys) {
      if (!seen.has(key)) issue(`rule references unknown field "${key}"`, ["rules", r]);
    }
  }
});

export interface TemplateIssue {
  path: string;
  message: string;
}

export function validateTemplate(schema: unknown): TemplateIssue[] {
  const result = formSchemaSchema.safeParse(schema);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}

/** Preset keys exist and their values are valid for the field (pinned values must also be allowed). */
export function validatePresets(schema: FormSchema, presets: ServiceFormPresets): TemplateIssue[] {
  const fields = new Map(allFields(schema).map((field) => [field.key, field]));
  const issues: TemplateIssue[] = [];
  const probe = { mode: "client" as const, now: new Date("2000-01-01T00:00:00Z") };
  for (const kind of ["pinned", "defaults"] as const) {
    for (const [key, value] of Object.entries(presets[kind] ?? {})) {
      const field = fields.get(key);
      if (!field) {
        issues.push({ path: `${kind}.${key}`, message: `field "${key}" is not in the template` });
        continue;
      }
      if (!fieldSchema({ ...field, required: false }, probe).safeParse(value).success) {
        issues.push({
          path: `${kind}.${key}`,
          message: `invalid value ${JSON.stringify(value)} for "${key}"`,
        });
      }
    }
  }
  for (const key of Object.keys(presets.pinned ?? {})) {
    if (key in (presets.defaults ?? {}))
      issues.push({ path: `pinned.${key}`, message: `"${key}" is both pinned and default` });
  }
  return issues;
}
