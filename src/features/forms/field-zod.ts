// FieldType → Zod (docs/03 §3.2). Each builder validates ONE visible field's value; emptiness
// ("", [], null) is normalised to undefined first, so required/optional is handled uniformly.
// Error messages come from the i18n dictionaries in the submitter's language (FieldContext.text).
import { z } from "zod";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { formatNumber, toLatinDigits } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { bdPhoneSchemaFor } from "@/lib/phone";

import {
  addDays,
  DATE_RE,
  dhakaLocalToInstant,
  dhakaToday,
  isValidDate,
  TIME_RE,
} from "./date-utils";
import { hasValue } from "./schema-utils";
import { type FormField, IMAGES_MAX_FILES } from "./types";

export type EngineMode = "client" | "server";

type Fixed = Omit<
  (typeof MESSAGES)["bn"]["forms"]["validation"],
  "min" | "max" | "minChars" | "maxChars" | "photosMax" | "itemsMin" | "itemsMax"
>;

/** Validation messages for one language (numbers already in that language's digits). */
export interface ValidationText extends Fixed {
  locale: Locale;
  min: (n: number) => string;
  max: (n: number) => string;
  minChars: (n: number) => string;
  maxChars: (n: number) => string;
  photosMax: (n: number) => string;
  itemsMin: (n: number) => string;
  itemsMax: (n: number) => string;
}

const texts = new Map<Locale, ValidationText>();

export function validationText(locale: Locale = DEFAULT_LOCALE): ValidationText {
  let text = texts.get(locale);
  if (!text) {
    const v = MESSAGES[locale].forms.validation;
    const fill = (template: string) => (n: number) =>
      template.replace("{n}", formatNumber(n, locale));
    text = {
      ...v,
      locale,
      min: fill(v.min),
      max: fill(v.max),
      minChars: fill(v.minChars),
      maxChars: fill(v.maxChars),
      photosMax: fill(v.photosMax),
      itemsMin: fill(v.itemsMin),
      itemsMax: fill(v.itemsMax),
    };
    texts.set(locale, text);
  }
  return text;
}

export interface FieldContext {
  mode: EngineMode;
  now: Date;
  text: ValidationText;
}

/** Rejects markup ("<b>", "</x", "<!--", "<?") but allows "< 5 kg". */
const HTML_TAG = /<[a-z!/?]/i;

/** Custom `error` that says "required" when the value is missing and `invalid` otherwise. */
const requiredOr = (m: ValidationText, invalid: string) => (issue: { input: unknown }) =>
  issue.input === undefined ? m.required : invalid;

/** BD mobile number → E.164, with messages in the form's language. */
export const phoneSchema = (m: ValidationText) =>
  z.string({ error: m.phone }).pipe(bdPhoneSchemaFor(m.locale));

/** Strips empty answers, then applies `required`. */
export function withPresence<T extends z.ZodType>(schema: T, required: boolean | undefined) {
  return z.preprocess(
    (value) => (hasValue(value) ? value : undefined),
    required ? schema : schema.optional(),
  );
}

/** Bangla digits → Latin, drop thousands separators; non-numeric stays as-is (then fails). */
function toNumberInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const cleaned = toLatinDigits(value).replace(/[,\s]/g, "");
  return cleaned === "" ? undefined : /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : value;
}

export function plainText(
  m: ValidationText,
  opts: { minLength?: number; maxLength?: number; pattern?: string; patternMessage?: string } = {},
) {
  let schema = z.string({ error: requiredOr(m, m.required) }).trim();
  if (opts.minLength) schema = schema.min(opts.minLength, m.minChars(opts.minLength));
  schema = schema.max(opts.maxLength ?? 2000, m.maxChars(opts.maxLength ?? 2000));
  if (opts.pattern)
    schema = schema.regex(new RegExp(opts.pattern), opts.patternMessage ?? m.pattern);
  return schema.refine((value) => !HTML_TAG.test(value), m.html);
}

function numberSchema(field: FormField, integer: boolean, m: ValidationText) {
  let schema = z.number({ error: requiredOr(m, m.number) });
  if (integer) schema = schema.int(m.integer);
  const lower = field.validation?.min ?? (integer ? 0 : undefined);
  if (lower !== undefined) schema = schema.min(lower, m.min(lower));
  if (field.validation?.max !== undefined)
    schema = schema.max(field.validation.max, m.max(field.validation.max));
  return z.preprocess(toNumberInput, schema);
}

function dateSchema(field: FormField, ctx: FieldContext) {
  const m = ctx.text;
  const today = dhakaToday(ctx.now);
  const earliest = addDays(today, field.validation?.min ?? 0);
  const latest =
    field.validation?.max !== undefined ? addDays(today, field.validation.max) : undefined;
  return z
    .string({ error: requiredOr(m, m.date) })
    .regex(DATE_RE, m.date)
    .refine(isValidDate, m.date)
    .refine((value) => value >= earliest, m.datePast)
    .refine((value) => !latest || value <= latest, m.dateLate);
}

function datetimeSchema(ctx: FieldContext) {
  const m = ctx.text;
  return (
    z
      .string({ error: requiredOr(m, m.date) })
      .refine((value) => dhakaLocalToInstant(value) !== null, m.date)
      // 5-minute grace so "now" picked a moment ago still passes on submit.
      .refine((value) => {
        const instant = dhakaLocalToInstant(value);
        return !instant || instant.getTime() >= ctx.now.getTime() - 5 * 60_000;
      }, m.datetimePast)
  );
}

const routePoint = (m: ValidationText) =>
  z.object({
    areaId: z
      .string()
      .trim()
      .max(64)
      .nullish()
      .transform((v) => v || null),
    address: plainText(m, { minLength: 2, maxLength: 200 }),
  });

function imagesSchema(
  field: FormField,
  ctx: FieldContext,
  limit = field.validation?.maxFiles ?? IMAGES_MAX_FILES,
) {
  const m = ctx.text;
  const cap = Math.min(limit, IMAGES_MAX_FILES);
  const item =
    ctx.mode === "server"
      ? z.string().min(1).max(64)
      : z.object({ id: z.string().min(1).max(64), url: z.string() });
  return z
    .array(item, { error: requiredOr(m, m.photos) })
    .min(field.required ? 1 : 0, m.photosMin)
    .max(cap, m.photosMax(cap));
}

/** Drops item rows the user left completely blank (the UI always shows at least one row). */
const dropBlankRows = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (row) =>
          row &&
          typeof row === "object" &&
          (hasValue((row as Record<string, unknown>).name) ||
            hasValue((row as Record<string, unknown>).qty)),
      )
    : value;

function itemListSchema(field: FormField, m: ValidationText) {
  const units = field.validation?.units ?? [];
  const row = z.object({
    name: plainText(m, { minLength: 1, maxLength: 80 }),
    qty: z.preprocess(
      toNumberInput,
      z
        .number({ error: requiredOr(m, m.number) })
        .gt(0, m.qtyPositive)
        .max(100_000),
    ),
    unit: z.enum(units.length ? (units as [string, ...string[]]) : ["piece"], {
      error: m.choose,
    }),
  });
  const lower = Math.max(field.validation?.min ?? 1, field.required ? 1 : 0);
  const upper = field.validation?.max ?? 50;
  return z.preprocess(
    dropBlankRows,
    z
      .array(row, { error: requiredOr(m, m.itemsRequired) })
      .min(lower, m.itemsMin(lower))
      .max(upper, m.itemsMax(upper)),
  );
}

function withUrlScheme(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? `https://${trimmed}` : trimmed;
}

/** Schema for one field's value (already known to be visible). */
export function fieldSchema(field: FormField, ctx: FieldContext): z.ZodType {
  const m = ctx.text;
  const v = field.validation ?? {};
  const options = (field.options ?? []).map((option) => option.value) as [string, ...string[]];

  switch (field.type) {
    case "text":
      return withPresence(
        plainText(m, {
          minLength: v.minLength,
          maxLength: v.maxLength ?? 200,
          pattern: v.pattern,
          patternMessage: v.patternMessage
            ? v.patternMessage[m.locale] || v.patternMessage.bn
            : undefined,
        }),
        field.required,
      );
    case "textarea":
      return withPresence(
        plainText(m, { minLength: v.minLength, maxLength: v.maxLength ?? 2000 }),
        field.required,
      );
    case "number":
      return withPresence(numberSchema(field, false, m), field.required);
    case "money":
      return withPresence(numberSchema(field, true, m), field.required);
    case "phone":
      return withPresence(phoneSchema(m), field.required);
    case "url":
      return withPresence(
        z.preprocess(withUrlScheme, z.url({ protocol: /^https?$/, error: m.url }).max(500)),
        field.required,
      );
    case "select":
    case "radio":
      return withPresence(z.enum(options, { error: requiredOr(m, m.choose) }), field.required);
    case "multiselect":
    case "checkboxes":
      return withPresence(
        z
          .array(z.enum(options, { error: m.choose }), {
            error: requiredOr(m, m.choose),
          })
          .transform((values) => [...new Set(values)]),
        field.required,
      );
    case "boolean": {
      const toBool = (value: unknown) =>
        value === "true" || value === "on" ? true : value === "false" ? false : value;
      return z.preprocess(
        toBool,
        field.required ? z.literal(true, { error: m.required }) : z.boolean().optional(),
      );
    }
    case "date":
      return withPresence(dateSchema(field, ctx), field.required);
    case "time":
      return withPresence(
        z.string({ error: requiredOr(m, m.time) }).regex(TIME_RE, m.time),
        field.required,
      );
    case "datetime":
      return withPresence(datetimeSchema(ctx), field.required);
    case "daterange":
      return withPresence(
        z
          .object({ from: dateSchema(field, ctx), to: dateSchema(field, ctx) })
          .refine((range) => range.to >= range.from, {
            message: m.rangeOrder,
            path: ["to"],
          }),
        field.required,
      );
    case "area":
      return withPresence(
        z
          .string({ error: requiredOr(m, m.area) })
          .trim()
          .min(1, m.area)
          .max(64),
        field.required,
      );
    case "address":
      return withPresence(
        z.object({
          areaId: z.string({ error: m.area }).trim().min(1, m.area).max(64),
          line: plainText(m, { minLength: 3, maxLength: 200 }),
          landmark: z.preprocess(
            (x) => (hasValue(x) ? x : undefined),
            plainText(m, { maxLength: 100 }).optional(),
          ),
        }),
        field.required,
      );
    case "route": {
      const point = routePoint(m);
      return withPresence(
        z
          .object({ from: point, to: point })
          .refine(
            (route) =>
              !(
                (route.from.areaId ?? "") === (route.to.areaId ?? "") &&
                route.from.address.toLowerCase() === route.to.address.toLowerCase()
              ),
            { message: m.sameRoute, path: ["to", "address"] },
          ),
        field.required,
      );
    }
    case "person":
      return withPresence(
        z.object({ name: plainText(m, { minLength: 2, maxLength: 60 }), phone: phoneSchema(m) }),
        field.required,
      );
    case "item_list":
      return withPresence(itemListSchema(field, m), field.required);
    case "images":
      return withPresence(imagesSchema(field, ctx), field.required);
    case "heading":
      return z.undefined().optional();
  }
}
