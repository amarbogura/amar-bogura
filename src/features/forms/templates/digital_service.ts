import type { FormField, FormSection, FormTemplateSeed } from "../types";
import { defineTemplate, DIGITAL_BUDGET_OPTIONS, options } from "./_helpers";

/** Base fields shared by every IT & Digital template (docs/03 §4.9). Returns fresh objects. */
export const digitalBaseFields = (): FormField[] => [
  {
    key: "businessName",
    type: "text",
    label: { bn: "ব্যবসা / প্রতিষ্ঠানের নাম", en: "Business name" },
    validation: { maxLength: 80 },
    width: "half",
  },
  {
    key: "businessType",
    type: "select",
    label: { bn: "ব্যবসার ধরন", en: "Business type" },
    width: "half",
    options: options([
      ["shop", "দোকান / রিটেইল", "Shop / retail"],
      ["online_shop", "অনলাইন শপ / এফ-কমার্স", "Online shop"],
      ["restaurant", "রেস্টুরেন্ট / খাবার", "Restaurant"],
      ["education", "শিক্ষা প্রতিষ্ঠান / কোচিং", "Education"],
      ["health", "ক্লিনিক / স্বাস্থ্যসেবা", "Health"],
      ["manufacturing", "উৎপাদন / কারখানা", "Manufacturing"],
      ["service", "সার্ভিস ব্যবসা", "Service business"],
      ["personal", "ব্যক্তিগত", "Personal"],
      ["other", "অন্যান্য", "Other"],
    ]),
  },
  {
    key: "existingLinks",
    type: "url",
    label: { bn: "বর্তমান পেজ / ওয়েবসাইটের লিংক", en: "Existing link" },
  },
  {
    key: "goal",
    type: "textarea",
    label: { bn: "আপনি কী অর্জন করতে চান", en: "Goal" },
    placeholder: { bn: "যেমন: মাসে ২০০ অর্ডার, বগুড়ায় নতুন কাস্টমার" },
    required: true,
    validation: { maxLength: 1000 },
  },
  {
    key: "budgetRange",
    type: "select",
    label: { bn: "বাজেট", en: "Budget" },
    required: true,
    summary: true,
    width: "half",
    options: DIGITAL_BUDGET_OPTIONS,
  },
  {
    key: "timeline",
    type: "select",
    label: { bn: "কত দিনের মধ্যে", en: "Timeline" },
    required: true,
    width: "half",
    options: options([
      ["urgent", "জরুরি", "Urgent"],
      ["1_week", "১ সপ্তাহ", "1 week"],
      ["2_4_weeks", "২–৪ সপ্তাহ", "2–4 weeks"],
      ["flexible", "সময় নিয়ে সমস্যা নেই", "Flexible"],
    ]),
  },
  {
    key: "attachments",
    type: "images",
    label: { bn: "রেফারেন্স ছবি / স্ক্রিনশট", en: "Attachments" },
    validation: { maxFiles: 5 },
  },
];

const DIGITAL_COMMON = {
  address: "optional",
  preferredDate: "hidden",
  preferredTimeSlot: "hidden",
  notes: "optional",
  photos: "hidden",
  altPhone: "optional",
} as const;

const baseSection = (): FormSection => ({
  key: "project",
  title: { bn: "প্রজেক্ট ও বাজেট", en: "Project & budget" },
  fields: digitalBaseFields(),
});

/** Builds a per-service IT template: service-specific section first, then the base section. */
export const digitalTemplate = (
  meta: Pick<FormTemplateSeed, "key" | "name" | "description">,
  specific: FormSection,
): FormTemplateSeed =>
  defineTemplate({
    ...meta,
    kind: "REQUEST",
    schema: {
      schemaVersion: 1,
      kind: "REQUEST",
      common: DIGITAL_COMMON,
      sections: [specific, baseSection()],
    },
  });

/** Category default for IT & Digital (used when a service has no specific template). */
export const digitalService = defineTemplate({
  key: "digital_service",
  name: "আইটি ও ডিজিটাল সার্ভিস",
  kind: "REQUEST",
  description: "Base template for IT & digital services",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: DIGITAL_COMMON,
    sections: [baseSection()],
  },
});
