// docs/03 §3.2 — one builder, used by the client form (zodResolver) AND the server action (P7).
import { z } from "zod";

import type { Locale } from "@/i18n/config";

import { dhakaLocalToInstant } from "./date-utils";
import {
  type EngineMode,
  fieldSchema,
  phoneSchema,
  plainText,
  validationText,
  type ValidationText,
  withPresence,
} from "./field-zod";
import { allFields, hasValue, tr } from "./schema-utils";
import {
  COMMON_PHOTOS_MAX,
  type CommonFieldConfig,
  type FormRule,
  type FormSchema,
  type ServiceFormPresets,
  TIME_SLOTS,
} from "./types";
import { computeKept, effectiveValues } from "./visibility";

export interface BuildOptions {
  mode: EngineMode;
  presets?: ServiceFormPresets;
  /** Injectable clock (tests); defaults to now. */
  now?: Date;
  /** Language of the error messages (default bn). The server uses the submitter's language. */
  locale?: Locale;
}

const contextFor = (options: BuildOptions) => ({
  mode: options.mode,
  now: options.now ?? new Date(),
  text: validationText(options.locale),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Comparable value for `after` rules (dates and Dhaka datetimes). */
function comparable(value: unknown): number | null {
  if (typeof value !== "string") return null;
  if (value.length === 10) return Date.parse(`${value}T00:00:00Z`);
  return dhakaLocalToInstant(value)?.getTime() ?? null;
}

function checkRule(
  rule: FormRule,
  data: Record<string, unknown>,
  kept: Set<string>,
  m: ValidationText,
) {
  switch (rule.type) {
    case "requireOneOf": {
      const visible = rule.fields.filter((key) => kept.has(key));
      if (visible.length === 0 || visible.some((key) => hasValue(data[key]))) return null;
      return { path: [visible[0]!], message: tr(rule.message, m.locale) };
    }
    case "after": {
      if (!kept.has(rule.field) || !kept.has(rule.than)) return null;
      const later = comparable(data[rule.field]);
      const earlier = comparable(data[rule.than]);
      if (later === null || earlier === null || later > earlier) return null;
      return { path: [rule.field], message: tr(rule.message, m.locale) || m.after };
    }
  }
}

/**
 * Details validator. Order (docs/03 §3.2): force pinned values → keep only visible (+pinned)
 * fields, which strips hidden AND unknown keys and means hidden-but-required fields are never
 * enforced → validate each field → cross-field rules. Output contains only kept, non-empty keys.
 */
export function buildDetailsSchema(schema: FormSchema, options: BuildOptions) {
  const ctx = contextFor(options);
  const fields = new Map(allFields(schema).map((field) => [field.key, field]));
  const perField = new Map([...fields].map(([key, field]) => [key, fieldSchema(field, ctx)]));

  return z.unknown().transform((raw, zctx) => {
    const values = effectiveValues(isRecord(raw) ? raw : {}, options.presets);
    const kept = computeKept(schema, values, options.presets);
    const out: Record<string, unknown> = {};
    let failed = false;

    for (const key of kept) {
      const field = fields.get(key);
      if (!field || field.type === "heading") continue;
      const result = perField.get(key)!.safeParse(values[key]);
      if (!result.success) {
        failed = true;
        for (const issue of result.error.issues) {
          zctx.addIssue({ code: "custom", message: issue.message, path: [key, ...issue.path] });
        }
      } else if (result.data !== undefined) {
        out[key] = result.data;
      }
    }
    if (failed) return z.NEVER;

    for (const rule of schema.rules ?? []) {
      const problem = checkRule(rule, out, kept, ctx.text);
      if (problem) {
        failed = true;
        zctx.addIssue({ code: "custom", ...problem });
      }
    }
    return failed ? z.NEVER : out;
  });
}

const active = (mode: CommonFieldConfig[keyof CommonFieldConfig]) =>
  mode === "required" || mode === "optional";

/** Common fields = real ServiceRequest columns (docs/03 §2). Contact is always required. */
export function buildCommonSchema(schema: FormSchema, options: BuildOptions) {
  if (schema.kind !== "REQUEST") return z.object({});
  const common = schema.common;
  const ctx = contextFor(options);
  const m = ctx.text;
  const shape: Record<string, z.ZodType> = {
    contactName: withPresence(plainText(m, { minLength: 2, maxLength: 60 }), true),
    contactPhone: withPresence(phoneSchema(m), true),
  };
  if (active(common.altPhone)) shape.altPhone = withPresence(phoneSchema(m), false);
  if (active(common.address)) {
    const required = common.address === "required";
    shape.areaId = withPresence(
      z.string({ error: m.area }).trim().min(1, m.area).max(64),
      required,
    );
    shape.addressLine = withPresence(plainText(m, { minLength: 3, maxLength: 200 }), required);
  }
  if (active(common.preferredDate)) {
    shape.preferredDate = fieldSchema(
      {
        key: "preferredDate",
        type: "date",
        label: { bn: "", en: "" },
        required: common.preferredDate === "required",
        validation: { min: 0, max: 90 },
      },
      ctx,
    );
  }
  if (active(common.preferredTimeSlot)) {
    shape.preferredTimeSlot = fieldSchema(
      {
        key: "preferredTimeSlot",
        type: "radio",
        label: { bn: "", en: "" },
        required: common.preferredTimeSlot === "required",
        options: TIME_SLOTS.map((slot) => ({ value: slot.value, label: slot.label })),
      },
      ctx,
    );
  }
  if (active(common.notes)) {
    shape.notes = withPresence(plainText(m, { maxLength: 500 }), common.notes === "required");
  }
  if (active(common.photos)) {
    shape.photos = fieldSchema(
      {
        key: "photos",
        type: "images",
        label: { bn: "", en: "" },
        required: common.photos === "required",
        validation: { maxFiles: COMMON_PHOTOS_MAX },
      },
      ctx,
    );
  }
  if (active(common.title)) {
    shape.title = withPresence(
      plainText(m, { minLength: 3, maxLength: 80 }),
      common.title === "required",
    );
  }
  // z.object strips unknown keys; hidden common fields are simply absent from the shape.
  return z.object(shape);
}

/** The full form: `{ common, details }` — what DynamicForm edits and P7's action validates. */
export function buildRequestFormSchema(schema: FormSchema, options: BuildOptions) {
  return z.object({
    common: buildCommonSchema(schema, options),
    details: buildDetailsSchema(schema, options),
  });
}

export type RequestFormValues = {
  common: Record<string, unknown>;
  details: Record<string, unknown>;
};

/** Client → server payload: image objects become media ids (everything else unchanged). */
export function toServerPayload(schema: FormSchema, values: RequestFormValues): RequestFormValues {
  const ids = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => (isRecord(item) ? item.id : item)) : value;
  const details = { ...values.details };
  for (const field of allFields(schema)) {
    if (field.type === "images" && field.key in details)
      details[field.key] = ids(details[field.key]);
  }
  const common = { ...values.common };
  if ("photos" in common) common.photos = ids(common.photos);
  return { common, details };
}
