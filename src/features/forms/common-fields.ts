// The final step's common fields (real ServiceRequest columns) expressed as FormFields, so the
// same renderer, formatter and DetailsView handle them. Which ones appear comes from `schema.common`.
// Labels come from the i18n dictionaries in both languages (the renderer picks one with tr()).
import { bn as bnMessages } from "@/i18n/messages/bn";
import { en as enMessages } from "@/i18n/messages/en";

import {
  COMMON_PHOTOS_MAX,
  type CommonMode,
  type FormField,
  type FormSchema,
  type I18n,
  TIME_SLOTS,
} from "./types";

const on = (mode: CommonMode | undefined) => mode === "required" || mode === "optional";

type CommonKey = keyof typeof bnMessages.forms.common;
const text = (key: CommonKey): I18n => ({
  bn: bnMessages.forms.common[key],
  en: enMessages.forms.common[key],
});

export function commonFields(schema: FormSchema): FormField[] {
  if (schema.kind !== "REQUEST") return [];
  const c = schema.common;
  const fields: FormField[] = [];

  if (on(c.title)) {
    fields.push({
      key: "title",
      type: "text",
      label: text("title"),
      placeholder: text("titlePlaceholder"),
      required: c.title === "required",
      validation: { maxLength: 80 },
    });
  }
  fields.push(
    {
      key: "contactName",
      type: "text",
      label: text("contactName"),
      required: true,
      width: "half",
      validation: { maxLength: 60 },
    },
    {
      key: "contactPhone",
      type: "phone",
      label: text("contactPhone"),
      required: true,
      width: "half",
    },
  );
  if (on(c.altPhone)) {
    fields.push({ key: "altPhone", type: "phone", label: text("altPhone"), width: "half" });
  }
  if (on(c.address)) {
    fields.push(
      { key: "areaId", type: "area", label: text("areaId"), required: c.address === "required" },
      {
        key: "addressLine",
        type: "text",
        label: text("addressLine"),
        placeholder: text("addressLinePlaceholder"),
        required: c.address === "required",
        validation: { maxLength: 200 },
      },
    );
  }
  if (on(c.preferredDate)) {
    fields.push({
      key: "preferredDate",
      type: "date",
      label: text("preferredDate"),
      required: c.preferredDate === "required",
      width: "half",
      validation: { min: 0, max: 90 },
    });
  }
  if (on(c.preferredTimeSlot)) {
    fields.push({
      key: "preferredTimeSlot",
      type: "radio",
      label: text("preferredTimeSlot"),
      required: c.preferredTimeSlot === "required",
      options: TIME_SLOTS.map((slot) => ({ value: slot.value, label: slot.label })),
    });
  }
  if (on(c.notes)) {
    fields.push({
      key: "notes",
      type: "textarea",
      label: text("notes"),
      required: c.notes === "required",
      validation: { maxLength: 500 },
    });
  }
  if (on(c.photos)) {
    fields.push({
      key: "photos",
      type: "images",
      label: text("photos"),
      help: text("photosHelp"),
      required: c.photos === "required",
      validation: { maxFiles: COMMON_PHOTOS_MAX },
    });
  }
  return fields;
}
