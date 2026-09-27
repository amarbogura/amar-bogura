// Form engine schema types — source of truth is docs/03 §2. Templates are data (stored as
// FormTemplateVersion.schema JSON) and must stay JSON-serializable: no functions, no Dates.

export type I18n = { bn: string; en?: string };

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "phone"
  | "url"
  | "select"
  | "multiselect"
  | "radio"
  | "checkboxes"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "daterange"
  | "area" // Area picker (upazila → area)
  | "address" // area + address line + optional landmark (object)
  | "route" // { from: address, to: address } — shifting, rental, courier
  | "person" // { name, phone } — e.g. courier recipient
  | "item_list" // repeater [{ name, qty, unit }] — grocery, bazar, medicine
  | "images" // Cloudinary media ids (max N)
  | "heading"; // display-only section text

export const CHOICE_FIELD_TYPES = ["select", "multiselect", "radio", "checkboxes"] as const;

export interface Option {
  value: string;
  label: I18n;
}

/**
 * Visibility rule. For multi-value fields (checkboxes / multiselect) `in` means "any selected
 * value is in `value`" and `notIn` means "none is"; for single values they test membership.
 */
export interface ShowIf {
  field: string; // key of another (earlier) field in the same template
  op: "eq" | "neq" | "in" | "notIn" | "truthy" | "falsy";
  value?: string | number | boolean | Array<string | number>;
}

export interface FormField {
  key: string; // stable camelCase; NEVER renamed once published
  type: FieldType;
  label: I18n;
  placeholder?: I18n;
  help?: I18n;
  required?: boolean;
  options?: Option[]; // select / multiselect / radio / checkboxes
  defaultValue?: unknown;
  validation?: {
    min?: number; // number/money/date offsets(days)/item count
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: I18n;
    maxFiles?: number; // images (hard cap 8)
    units?: string[]; // item_list units: kg, g, litre, piece, packet, dozen
  };
  showIf?: ShowIf | ShowIf[]; // array = AND
  width?: "full" | "half";
  summary?: boolean; // include in admin list summary / listing card chips
  filterable?: boolean; // listings only: expose as filter on browse page
}

export interface FormSection {
  key: string;
  title: I18n;
  description?: I18n;
  fields: FormField[];
}

// Common fields are real DB columns; the template only configures them.
export type CommonMode = "required" | "optional" | "hidden";

export interface CommonFieldConfig {
  address?: CommonMode; // area + addressLine (hide when template uses 'route')
  preferredDate?: CommonMode;
  preferredTimeSlot?: CommonMode;
  notes?: CommonMode;
  photos?: CommonMode; // generic photos (max 5)
  altPhone?: CommonMode;
}

export interface FormSchema {
  schemaVersion: 1;
  kind: "REQUEST" | "LISTING";
  common: CommonFieldConfig; // contactName + contactPhone always required for REQUEST
  sections: FormSection[];
  submitLabel?: I18n; // default "রিকোয়েস্ট পাঠান"
  notice?: I18n; // e.g. prescription legal note
}

/** A template as seeded from `templates/*.ts` into FormTemplate + FormTemplateVersion v1. */
export interface FormTemplateSeed {
  key: string;
  name: string;
  kind: FormSchema["kind"];
  description?: string;
  schema: FormSchema;
}

/**
 * Per-service values for a shared template (stored in `Service.formPresets`).
 * `pinned` fields are hidden and enforced server-side; `defaults` are only prefilled.
 */
export interface ServiceFormPresets {
  pinned?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
}

/** Keys owned by ServiceRequest columns (common fields); REQUEST templates must not use them. */
export const RESERVED_REQUEST_KEYS = [
  "contactName",
  "contactPhone",
  "altPhone",
  "areaId",
  "addressLine",
  "preferredDate",
  "preferredTimeSlot",
  "notes",
  "photos",
  "title",
  "price",
  "status",
  "code",
  "userId",
] as const;

/** Keys owned by Listing columns (incl. promoted property columns); LISTING templates must not use them. */
export const RESERVED_LISTING_KEYS = [
  "title",
  "description",
  "price",
  "pricePeriod",
  "negotiable",
  "condition",
  "areaId",
  "addressLine",
  "contactName",
  "contactPhone",
  "whatsappEnabled",
  "photos",
  "propertyPurpose",
  "propertyType",
  "bedrooms",
  "bathrooms",
  "sizeValue",
  "sizeUnit",
  "availableFrom",
  "status",
  "code",
  "userId",
] as const;

export const IMAGES_MAX_FILES = 8;
