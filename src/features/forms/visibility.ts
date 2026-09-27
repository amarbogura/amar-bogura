// docs/03 §3.1 — visibility first. Pure; used by the renderer, build-zod and the review/summary.
import { allFields, hasValue } from "./schema-utils";
import type { FormSchema, ServiceFormPresets, ShowIf } from "./types";

type Values = Record<string, unknown>;

const same = (a: unknown, b: unknown) =>
  a === b || (hasValue(a) && hasValue(b) && String(a) === String(b));

/**
 * Semantics:
 * - eq / neq compare a single value (`neq` only holds once the controller HAS a value, so a
 *   follow-up question doesn't appear before its controller is answered);
 * - in / notIn: membership; for multi-value controllers `in` = any overlap, `notIn` = no overlap;
 * - truthy / falsy: has an answer (`false` counts as falsy).
 */
export function ruleHolds(rule: ShowIf, controller: unknown): boolean {
  const list = Array.isArray(rule.value)
    ? rule.value
    : rule.value === undefined
      ? []
      : [rule.value];
  const values = Array.isArray(controller) ? controller : hasValue(controller) ? [controller] : [];
  switch (rule.op) {
    case "eq":
      return hasValue(controller) && same(controller, rule.value);
    case "neq":
      return hasValue(controller) && !same(controller, rule.value);
    case "in":
      return values.some((value) => list.some((item) => same(value, item)));
    case "notIn":
      return values.length > 0 && !values.some((value) => list.some((item) => same(value, item)));
    case "truthy":
      return hasValue(controller) && controller !== false;
    case "falsy":
      return !hasValue(controller) || controller === false;
  }
}

/** Pinned preset values override whatever the client sent (docs/03 §3.8). */
export function effectiveValues(values: Values, presets?: ServiceFormPresets): Values {
  return { ...values, ...(presets?.pinned ?? {}) };
}

/**
 * Keys of the fields the user sees, evaluated in field order. A field is hidden if any of its
 * rules fail or reference a field that is itself hidden (cascade). Pinned fields are never shown,
 * but their (forced) value still drives other fields' rules — e.g. AC `variant`.
 */
export function computeVisible(
  schema: FormSchema,
  values: Values,
  presets?: ServiceFormPresets,
): Set<string> {
  const current = effectiveValues(values, presets);
  const pinned = new Set(Object.keys(presets?.pinned ?? {}));
  const visible = new Set<string>();
  const active = new Set<string>(); // fields whose value may drive rules: visible or pinned

  for (const field of allFields(schema)) {
    const rules = field.showIf ? [field.showIf].flat() : [];
    const shown = rules.every(
      (rule) => active.has(rule.field) && ruleHolds(rule, current[rule.field]),
    );
    if (!shown) continue;
    active.add(field.key);
    if (!pinned.has(field.key)) visible.add(field.key);
  }
  return visible;
}

/** Visible + pinned keys: exactly the keys kept in submitted details. */
export function computeKept(
  schema: FormSchema,
  values: Values,
  presets?: ServiceFormPresets,
): Set<string> {
  const kept = computeVisible(schema, values, presets);
  for (const key of Object.keys(presets?.pinned ?? {})) {
    if (allFields(schema).some((field) => field.key === key)) kept.add(key);
  }
  return kept;
}
