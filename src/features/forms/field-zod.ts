// FieldType → Zod (docs/03 §3.2). Each builder validates ONE visible field's value; emptiness
// ("", [], null) is normalised to undefined first, so required/optional is handled uniformly.
import { z } from "zod";

import { toLatinDigits } from "@/lib/bangla";
import { bdPhoneSchema } from "@/lib/phone";

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
export interface FieldContext {
  mode: EngineMode;
  now: Date;
}

export const MESSAGES = {
  required: "এই তথ্যটি দিন।",
  choose: "একটি অপশন বেছে নিন।",
  number: "সঠিক সংখ্যা দিন।",
  integer: "পূর্ণ সংখ্যা দিন (দশমিক ছাড়া)।",
  html: "লেখায় < বা > দিয়ে কোনো ট্যাগ ব্যবহার করা যাবে না।",
  url: "সঠিক লিংক দিন (যেমন https://facebook.com/…)।",
  date: "সঠিক তারিখ দিন।",
  datePast: "আজ বা পরের কোনো তারিখ দিন।",
  dateLate: "এত পরের তারিখ দেওয়া যাবে না।",
  time: "সঠিক সময় দিন।",
  datetimePast: "এখন বা পরের কোনো সময় দিন।",
  sameRoute: "যাত্রা শুরু ও গন্তব্য একই হতে পারে না।",
  rangeOrder: "শেষের তারিখ শুরুর তারিখের পরে হতে হবে।",
  area: "এলাকা বেছে নিন।",
} as const;

const bnNumber = (n: number) => n.toLocaleString("bn-BD");
const min = (n: number) => `কমপক্ষে ${bnNumber(n)} দিন।`;
const max = (n: number) => `সর্বোচ্চ ${bnNumber(n)} দেওয়া যাবে।`;
const minChars = (n: number) => `কমপক্ষে ${bnNumber(n)} অক্ষর লিখুন।`;
const maxChars = (n: number) => `সর্বোচ্চ ${bnNumber(n)} অক্ষর লেখা যাবে।`;

/** Rejects markup ("<b>", "</x", "<!--", "<?") but allows "< 5 kg". */
const HTML_TAG = /<[a-z!/?]/i;

/** Custom `error` that says "required" when the value is missing and `invalid` otherwise. */
const requiredOr = (invalid: string) => (issue: { input: unknown }) =>
  issue.input === undefined ? MESSAGES.required : invalid;

/** BD mobile number → E.164, with a Bangla message when it is missing. */
export const phoneSchema = z.string({ error: "মোবাইল নম্বর দিন" }).pipe(bdPhoneSchema);

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
  opts: { minLength?: number; maxLength?: number; pattern?: string; patternMessage?: string } = {},
) {
  let schema = z.string({ error: requiredOr(MESSAGES.required) }).trim();
  if (opts.minLength) schema = schema.min(opts.minLength, minChars(opts.minLength));
  schema = schema.max(opts.maxLength ?? 2000, maxChars(opts.maxLength ?? 2000));
  if (opts.pattern)
    schema = schema.regex(new RegExp(opts.pattern), opts.patternMessage ?? "সঠিক ফরম্যাটে লিখুন।");
  return schema.refine((value) => !HTML_TAG.test(value), MESSAGES.html);
}

function numberSchema(field: FormField, integer: boolean) {
  let schema = z.number({ error: requiredOr(MESSAGES.number) });
  if (integer) schema = schema.int(MESSAGES.integer);
  const lower = field.validation?.min ?? (integer ? 0 : undefined);
  if (lower !== undefined) schema = schema.min(lower, min(lower));
  if (field.validation?.max !== undefined)
    schema = schema.max(field.validation.max, max(field.validation.max));
  return z.preprocess(toNumberInput, schema);
}

function dateSchema(field: FormField, ctx: FieldContext) {
  const today = dhakaToday(ctx.now);
  const earliest = addDays(today, field.validation?.min ?? 0);
  const latest =
    field.validation?.max !== undefined ? addDays(today, field.validation.max) : undefined;
  return z
    .string({ error: requiredOr(MESSAGES.date) })
    .regex(DATE_RE, MESSAGES.date)
    .refine(isValidDate, MESSAGES.date)
    .refine((value) => value >= earliest, MESSAGES.datePast)
    .refine((value) => !latest || value <= latest, MESSAGES.dateLate);
}

function datetimeSchema(ctx: FieldContext) {
  return (
    z
      .string({ error: requiredOr(MESSAGES.date) })
      .refine((value) => dhakaLocalToInstant(value) !== null, MESSAGES.date)
      // 5-minute grace so "now" picked a moment ago still passes on submit.
      .refine((value) => {
        const instant = dhakaLocalToInstant(value);
        return !instant || instant.getTime() >= ctx.now.getTime() - 5 * 60_000;
      }, MESSAGES.datetimePast)
  );
}

const routePoint = z.object({
  areaId: z
    .string()
    .trim()
    .max(64)
    .nullish()
    .transform((v) => v || null),
  address: plainText({ minLength: 2, maxLength: 200 }),
});

function imagesSchema(
  field: FormField,
  ctx: FieldContext,
  limit = field.validation?.maxFiles ?? IMAGES_MAX_FILES,
) {
  const cap = Math.min(limit, IMAGES_MAX_FILES);
  const item =
    ctx.mode === "server"
      ? z.string().min(1).max(64)
      : z.object({ id: z.string().min(1).max(64), url: z.string() });
  return z
    .array(item, { error: requiredOr("ছবি দিন।") })
    .min(field.required ? 1 : 0, "অন্তত একটি ছবি দিন।")
    .max(cap, `সর্বোচ্চ ${bnNumber(cap)}টি ছবি দেওয়া যাবে।`);
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

function itemListSchema(field: FormField) {
  const units = field.validation?.units ?? [];
  const row = z.object({
    name: plainText({ minLength: 1, maxLength: 80 }),
    qty: z.preprocess(
      toNumberInput,
      z
        .number({ error: requiredOr(MESSAGES.number) })
        .gt(0, "পরিমাণ ০-এর বেশি দিন।")
        .max(100_000),
    ),
    unit: z.enum(units.length ? (units as [string, ...string[]]) : ["piece"], {
      error: MESSAGES.choose,
    }),
  });
  const lower = Math.max(field.validation?.min ?? 1, field.required ? 1 : 0);
  const upper = field.validation?.max ?? 50;
  return z.preprocess(
    dropBlankRows,
    z
      .array(row, { error: requiredOr("তালিকায় অন্তত একটি পণ্য লিখুন।") })
      .min(lower, `তালিকায় অন্তত ${bnNumber(lower)}টি পণ্য লিখুন।`)
      .max(upper, `সর্বোচ্চ ${bnNumber(upper)}টি পণ্য দেওয়া যাবে।`),
  );
}

function withUrlScheme(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? `https://${trimmed}` : trimmed;
}

/** Schema for one field's value (already known to be visible). */
export function fieldSchema(field: FormField, ctx: FieldContext): z.ZodType {
  const v = field.validation ?? {};
  const options = (field.options ?? []).map((option) => option.value) as [string, ...string[]];

  switch (field.type) {
    case "text":
      return withPresence(
        plainText({
          minLength: v.minLength,
          maxLength: v.maxLength ?? 200,
          pattern: v.pattern,
          patternMessage: v.patternMessage?.bn,
        }),
        field.required,
      );
    case "textarea":
      return withPresence(
        plainText({ minLength: v.minLength, maxLength: v.maxLength ?? 2000 }),
        field.required,
      );
    case "number":
      return withPresence(numberSchema(field, false), field.required);
    case "money":
      return withPresence(numberSchema(field, true), field.required);
    case "phone":
      return withPresence(phoneSchema, field.required);
    case "url":
      return withPresence(
        z.preprocess(withUrlScheme, z.url({ protocol: /^https?$/, error: MESSAGES.url }).max(500)),
        field.required,
      );
    case "select":
    case "radio":
      return withPresence(z.enum(options, { error: requiredOr(MESSAGES.choose) }), field.required);
    case "multiselect":
    case "checkboxes":
      return withPresence(
        z
          .array(z.enum(options, { error: MESSAGES.choose }), {
            error: requiredOr(MESSAGES.choose),
          })
          .transform((values) => [...new Set(values)]),
        field.required,
      );
    case "boolean": {
      const toBool = (value: unknown) =>
        value === "true" || value === "on" ? true : value === "false" ? false : value;
      return z.preprocess(
        toBool,
        field.required ? z.literal(true, { error: MESSAGES.required }) : z.boolean().optional(),
      );
    }
    case "date":
      return withPresence(dateSchema(field, ctx), field.required);
    case "time":
      return withPresence(
        z.string({ error: requiredOr(MESSAGES.time) }).regex(TIME_RE, MESSAGES.time),
        field.required,
      );
    case "datetime":
      return withPresence(datetimeSchema(ctx), field.required);
    case "daterange":
      return withPresence(
        z
          .object({ from: dateSchema(field, ctx), to: dateSchema(field, ctx) })
          .refine((range) => range.to >= range.from, {
            message: MESSAGES.rangeOrder,
            path: ["to"],
          }),
        field.required,
      );
    case "area":
      return withPresence(
        z
          .string({ error: requiredOr(MESSAGES.area) })
          .trim()
          .min(1, MESSAGES.area)
          .max(64),
        field.required,
      );
    case "address":
      return withPresence(
        z.object({
          areaId: z.string({ error: MESSAGES.area }).trim().min(1, MESSAGES.area).max(64),
          line: plainText({ minLength: 3, maxLength: 200 }),
          landmark: z.preprocess(
            (x) => (hasValue(x) ? x : undefined),
            plainText({ maxLength: 100 }).optional(),
          ),
        }),
        field.required,
      );
    case "route":
      return withPresence(
        z
          .object({ from: routePoint, to: routePoint })
          .refine(
            (route) =>
              !(
                (route.from.areaId ?? "") === (route.to.areaId ?? "") &&
                route.from.address.toLowerCase() === route.to.address.toLowerCase()
              ),
            { message: MESSAGES.sameRoute, path: ["to", "address"] },
          ),
        field.required,
      );
    case "person":
      return withPresence(
        z.object({ name: plainText({ minLength: 2, maxLength: 60 }), phone: phoneSchema }),
        field.required,
      );
    case "item_list":
      return withPresence(itemListSchema(field), field.required);
    case "images":
      return withPresence(imagesSchema(field, ctx), field.required);
    case "heading":
      return z.undefined().optional();
  }
}
