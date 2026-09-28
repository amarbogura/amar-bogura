// Stored value → display text in the page's language. Shared by DetailsView, the review step and
// summarize(). Option labels come from the stored template version; everything else from i18n.
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { formatDate, formatDateTime, formatMoney, toLocaleDigits } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { formatBdPhoneDisplay } from "@/lib/phone";

import { dhakaLocalToInstant } from "./date-utils";
import { hasValue, tr } from "./schema-utils";
import type {
  AddressValue,
  DateRangeValue,
  FormField,
  ItemRow,
  PersonValue,
  RouteValue,
} from "./types";

/** Unit label (kg, litre, হালি…) for an item_list unit code. */
export function unitLabel(unit: string, locale: Locale = DEFAULT_LOCALE): string {
  const units = MESSAGES[locale].forms.units as Record<string, string>;
  return units[unit] ?? unit;
}

export interface FormatContext {
  /** areaId → name in the page's language (for area / address / route). */
  areaNames?: ReadonlyMap<string, string>;
  locale?: Locale;
}

const areaText = (id: string | null | undefined, ctx: FormatContext) =>
  id ? (ctx.areaNames?.get(id) ?? "") : "";
const join = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(", ");

function optionLabel(field: FormField, value: unknown, locale: Locale): string {
  return (
    tr(field.options?.find((option) => option.value === String(value))?.label, locale) ||
    String(value)
  );
}

/** Human text for a field value, or "" when there is nothing to show. */
export function formatValue(field: FormField, value: unknown, ctx: FormatContext = {}): string {
  if (!hasValue(value) && value !== false) return "";
  const locale = ctx.locale ?? DEFAULT_LOCALE;
  const common = MESSAGES[locale].common;
  const dateText = (ymd: string) => formatDate(new Date(`${ymd}T00:00:00+06:00`), locale);
  switch (field.type) {
    case "select":
    case "radio":
      return optionLabel(field, value, locale);
    case "multiselect":
    case "checkboxes":
      return (value as unknown[]).map((item) => optionLabel(field, item, locale)).join(", ");
    case "boolean":
      return value === true ? common.yes : common.no;
    case "number":
      return toLocaleDigits(String(value), locale);
    case "money":
      return typeof value === "number" ? formatMoney(value, locale) : String(value);
    case "phone":
      return formatBdPhoneDisplay(String(value), locale);
    case "date":
      return dateText(String(value));
    case "datetime": {
      const instant = dhakaLocalToInstant(String(value));
      return instant ? formatDateTime(instant, locale) : String(value);
    }
    case "time":
      return toLocaleDigits(String(value), locale);
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
      return `${person.name} (${formatBdPhoneDisplay(person.phone, locale)})`;
    }
    case "item_list":
      return (value as ItemRow[])
        .map(
          (row) =>
            `${row.name} ${toLocaleDigits(String(row.qty), locale)} ${unitLabel(row.unit, locale)}`,
        )
        .join(", ");
    case "images":
      return MESSAGES[locale].forms.photoCount.replace(
        "{count}",
        toLocaleDigits((value as unknown[]).length, locale),
      );
    case "heading":
      return "";
    default:
      return String(value);
  }
}
