import type { CommonFieldConfig, FormTemplateSeed, Option } from "../types";

/** Identity helper so each template file is type-checked against FormTemplateSeed. */
export const defineTemplate = (template: FormTemplateSeed): FormTemplateSeed => template;

/** Builds an option list from `[value, bangla, english?]` tuples. */
export const options = (items: Array<[value: string, bn: string, en: string]>): Option[] =>
  items.map(([value, bn, en]) => ({ value, label: { bn, en } }));

/** Default common-field config for on-site services (docs/03 §4.1). */
export const ON_SITE_COMMON: CommonFieldConfig = {
  address: "required",
  preferredDate: "required",
  preferredTimeSlot: "required",
  notes: "optional",
  photos: "optional",
  altPhone: "optional",
};

export const URGENCY_OPTIONS = options([
  ["normal", "সাধারণ (২–৩ দিনের মধ্যে)", "Normal (within 2–3 days)"],
  ["today", "আজকেই দরকার", "Needed today"],
  ["emergency", "জরুরি", "Emergency"],
]);

export const EVENT_TYPE_OPTIONS = options([
  ["wedding", "বিয়ে", "Wedding"],
  ["holud", "গায়ে হলুদ", "Gaye holud"],
  ["reception", "বৌভাত / রিসেপশন", "Bou-bhat / reception"],
  ["engagement", "এনগেজমেন্ট / আকদ", "Engagement / akd"],
  ["aqiqah", "আকিকা", "Aqiqah"],
  ["birthday", "জন্মদিন", "Birthday"],
  ["corporate", "অফিস / কর্পোরেট অনুষ্ঠান", "Office / corporate event"],
  ["other", "অন্যান্য", "Other"],
]);

export const EVENT_BUDGET_OPTIONS = options([
  ["lt_10k", "১০,০০০ টাকার কম", "Under ৳10,000"],
  ["10k_25k", "১০,০০০ – ২৫,০০০ টাকা", "৳10,000–25,000"],
  ["25k_50k", "২৫,০০০ – ৫০,০০০ টাকা", "৳25,000–50,000"],
  ["50k_1l", "৫০,০০০ – ১ লাখ টাকা", "৳50,000–1 lakh"],
  ["gt_1l", "১ লাখ টাকার বেশি", "Over ৳1 lakh"],
]);

export const DIGITAL_BUDGET_OPTIONS = options([
  ["lt_5k", "৫,০০০ টাকার কম", "Under ৳5,000"],
  ["5k_15k", "৫,০০০ – ১৫,০০০ টাকা", "৳5,000–15,000"],
  ["15k_50k", "১৫,০০০ – ৫০,০০০ টাকা", "৳15,000–50,000"],
  ["50k_1l", "৫০,০০০ – ১ লাখ টাকা", "৳50,000–1 lakh"],
  ["gt_1l", "১ লাখ টাকার বেশি", "Over ৳1 lakh"],
  ["discuss", "আলোচনা করে ঠিক করতে চাই", "Let's discuss"],
]);

export const LISTING_WARRANTY_OPTIONS = options([
  ["none", "ওয়ারেন্টি নেই", "No warranty"],
  ["lt_6m", "৬ মাসের কম", "< 6 months"],
  ["6_12m", "৬–১২ মাস", "6–12 months"],
  ["gt_1y", "১ বছরের বেশি", "> 1 year"],
]);
