import { defineTemplate } from "./_helpers";

export const listingBike = defineTemplate({
  key: "listing_bike",
  name: "মোটরসাইকেল (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: motorcycles",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "bike",
        title: { bn: "বাইকের তথ্য", en: "Bike details" },
        fields: [
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            placeholder: { bn: "যেমন: Yamaha, Bajaj, Honda", en: "e.g. Yamaha, Bajaj, Honda" },
            required: true,
            summary: true,
            filterable: true,
            validation: { maxLength: 40 },
            width: "half",
          },
          {
            key: "model",
            type: "text",
            label: { bn: "মডেল", en: "Model" },
            required: true,
            validation: { maxLength: 60 },
            width: "half",
          },
          {
            key: "year",
            type: "number",
            label: { bn: "মডেল বছর", en: "Model year" },
            summary: true,
            filterable: true,
            validation: { min: 1980, max: 2100 },
            width: "half",
          },
          {
            key: "kmRun",
            type: "number",
            label: { bn: "কত কিমি চলেছে", en: "Kilometres run" },
            summary: true,
            validation: { min: 0, max: 1000000 },
            width: "half",
          },
          {
            key: "engineCc",
            type: "number",
            label: { bn: "ইঞ্জিন (সিসি)", en: "Engine (cc)" },
            filterable: true,
            validation: { min: 50, max: 2000 },
          },
          {
            key: "registered",
            type: "boolean",
            label: { bn: "রেজিস্ট্রেশন করা", en: "Registered" },
          },
          {
            key: "regYear",
            type: "number",
            label: { bn: "রেজিস্ট্রেশনের বছর", en: "Registration year" },
            validation: { min: 1980, max: 2100 },
            showIf: { field: "registered", op: "truthy" },
          },
          {
            key: "papersUpdated",
            type: "boolean",
            label: { bn: "কাগজপত্র হালনাগাদ", en: "Papers up to date" },
          },
          {
            key: "taxTokenValid",
            type: "boolean",
            label: { bn: "ট্যাক্স টোকেন বৈধ", en: "Tax token valid" },
          },
        ],
      },
    ],
  },
});
