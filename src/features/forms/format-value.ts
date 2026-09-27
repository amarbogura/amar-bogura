// Stored value → Bangla display text. Shared by DetailsView, the review step and summarize().
import { toBanglaDigits } from "@/lib/bangla";
import { formatTaka } from "@/lib/money";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { formatDhakaDate, formatDhakaDateTime } from "@/lib/time";

import { dhakaLocalToInstant } from "./date-utils";
import { bn, hasValue } from "./schema-utils";
import type {
  AddressValue,
  DateRangeValue,
  FormField,
  ItemRow,
  PersonValue,
  RouteValue,
} from "./types";

export const UNIT_LABELS: Record<string, string> = {
  kg: "কেজি",
  g: "গ্রাম",
  litre: "লিটার",
  piece: "পিস",
  pcs: "পিস",
  packet: "প্যাকেট",
  dozen: "ডজন",
  hali: "হালি",
  strip: "পাতা",
  box: "বক্স",
  bottle: "বোতল",
};

export interface FormatContext {
  /** areaId → Bangla name (for area / address / route). */
  areaNames?: ReadonlyMap<string, string>;
}

const dateText = (ymd: string) => formatDhakaDate(new Date(`${ymd}T00:00:00+06:00`));
const areaText = (id: string | null | undefined, ctx: FormatContext) =>
  id ? (ctx.areaNames?.get(id) ?? "") : "";
const join = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(", ");

function optionLabel(field: FormField, value: unknown): string {
  return (
    bn(field.options?.find((option) => option.value === String(value))?.label) || String(value)
  );
}

/** Human text for a field value, or "" when there is nothing to show. */
export function formatValue(field: FormField, value: unknown, ctx: FormatContext = {}): string {
  if (!hasValue(value) && value !== false) return "";
  switch (field.type) {
    case "select":
    case "radio":
      return optionLabel(field, value);
    case "multiselect":
    case "checkboxes":
      return (value as unknown[]).map((item) => optionLabel(field, item)).join(", ");
    case "boolean":
      return value === true ? "হ্যাঁ" : "না";
    case "number":
      return toBanglaDigits(String(value));
    case "money":
      return typeof value === "number" ? formatTaka(value) : String(value);
    case "phone":
      return formatBdPhoneDisplay(String(value));
    case "date":
      return dateText(String(value));
    case "datetime": {
      const instant = dhakaLocalToInstant(String(value));
      return instant ? formatDhakaDateTime(instant) : String(value);
    }
    case "time":
      return toBanglaDigits(String(value));
    case "daterange": {
      const range = value as DateRangeValue;
      return `${dateText(range.from)} – ${dateText(range.to)}`;
    }
    case "area":
      return areaText(String(value), ctx) || String(value);
    case "address": {
      const address = value as AddressValue;
      return join(address.line, address.landmark, areaText(address.areaId, ctx));
    }
    case "route": {
      const route = value as RouteValue;
      const point = (p: RouteValue["from"]) => join(p.address, areaText(p.areaId, ctx));
      return `${point(route.from)} → ${point(route.to)}`;
    }
    case "person": {
      const person = value as PersonValue;
      return `${person.name} (${formatBdPhoneDisplay(person.phone)})`;
    }
    case "item_list":
      return (value as ItemRow[])
        .map(
          (row) =>
            `${row.name} ${toBanglaDigits(String(row.qty))} ${UNIT_LABELS[row.unit] ?? row.unit}`,
        )
        .join(", ");
    case "images":
      return `${toBanglaDigits((value as unknown[]).length)}টি ছবি`;
    case "heading":
      return "";
    default:
      return String(value);
  }
}
