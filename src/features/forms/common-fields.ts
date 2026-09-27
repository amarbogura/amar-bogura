// The final step's common fields (real ServiceRequest columns) expressed as FormFields, so the
// same renderer, formatter and DetailsView handle them. Which ones appear comes from `schema.common`.
import {
  COMMON_PHOTOS_MAX,
  type CommonMode,
  type FormField,
  type FormSchema,
  TIME_SLOTS,
} from "./types";

const on = (mode: CommonMode | undefined) => mode === "required" || mode === "optional";

export function commonFields(schema: FormSchema): FormField[] {
  if (schema.kind !== "REQUEST") return [];
  const c = schema.common;
  const fields: FormField[] = [];

  if (on(c.title)) {
    fields.push({
      key: "title",
      type: "text",
      label: { bn: "এক লাইনে কী দরকার" },
      placeholder: { bn: "যেমন: পুরাতন খাট মেরামত" },
      required: c.title === "required",
      validation: { maxLength: 80 },
    });
  }
  fields.push(
    {
      key: "contactName",
      type: "text",
      label: { bn: "আপনার নাম" },
      required: true,
      width: "half",
      validation: { maxLength: 60 },
    },
    {
      key: "contactPhone",
      type: "phone",
      label: { bn: "মোবাইল নম্বর" },
      required: true,
      width: "half",
    },
  );
  if (on(c.altPhone)) {
    fields.push({
      key: "altPhone",
      type: "phone",
      label: { bn: "বিকল্প মোবাইল নম্বর" },
      width: "half",
    });
  }
  if (on(c.address)) {
    fields.push(
      { key: "areaId", type: "area", label: { bn: "এলাকা" }, required: c.address === "required" },
      {
        key: "addressLine",
        type: "text",
        label: { bn: "বিস্তারিত ঠিকানা" },
        placeholder: { bn: "বাসা নং, রাস্তা, মহল্লা, কাছের পরিচিত জায়গা" },
        required: c.address === "required",
        validation: { maxLength: 200 },
      },
    );
  }
  if (on(c.preferredDate)) {
    fields.push({
      key: "preferredDate",
      type: "date",
      label: { bn: "কবে দরকার" },
      required: c.preferredDate === "required",
      width: "half",
      validation: { min: 0, max: 90 },
    });
  }
  if (on(c.preferredTimeSlot)) {
    fields.push({
      key: "preferredTimeSlot",
      type: "radio",
      label: { bn: "কোন সময়ে সুবিধা" },
      required: c.preferredTimeSlot === "required",
      options: TIME_SLOTS.map((slot) => ({ value: slot.value, label: slot.label })),
    });
  }
  if (on(c.notes)) {
    fields.push({
      key: "notes",
      type: "textarea",
      label: { bn: "আরও কিছু জানাতে চাইলে" },
      required: c.notes === "required",
      validation: { maxLength: 500 },
    });
  }
  if (on(c.photos)) {
    fields.push({
      key: "photos",
      type: "images",
      label: { bn: "ছবি" },
      help: { bn: "সমস্যার ছবি দিলে দ্রুত খরচ জানানো যায়।" },
      required: c.photos === "required",
      validation: { maxFiles: COMMON_PHOTOS_MAX },
    });
  }
  return fields;
}
