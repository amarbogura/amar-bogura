// docs/03 §3.5 — initial form values: field defaults → service preset defaults → user prefill.
import type { RequestFormValues } from "./build-zod";
import { allFields } from "./schema-utils";
import type { FormSchema, ServiceFormPresets } from "./types";

export interface Prefill {
  name?: string | null;
  /** E.164; shown to the user in local 01… form. */
  phone?: string | null;
  areaId?: string | null;
}

const DYNAMIC_DATES = new Set(["date", "datetime", "daterange"]);

export function initialValues(
  schema: FormSchema,
  { presets, prefill }: { presets?: ServiceFormPresets; prefill?: Prefill } = {},
): RequestFormValues {
  const details: Record<string, unknown> = {};
  for (const field of allFields(schema)) {
    // Date defaults would be stale (relative to "now") — never baked into templates.
    if (field.defaultValue !== undefined && !DYNAMIC_DATES.has(field.type)) {
      details[field.key] = structuredClone(field.defaultValue);
    }
  }
  Object.assign(details, structuredClone(presets?.defaults ?? {}));

  const common: Record<string, unknown> = {};
  if (schema.kind === "REQUEST") {
    if (prefill?.name) common.contactName = prefill.name;
    if (prefill?.phone)
      common.contactPhone = prefill.phone.startsWith("+880")
        ? `0${prefill.phone.slice(4)}`
        : prefill.phone;
    if (prefill?.areaId && schema.common.address && schema.common.address !== "hidden")
      common.areaId = prefill.areaId;
  }
  return { common, details };
}
