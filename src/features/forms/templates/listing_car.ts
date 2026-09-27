import { defineTemplate, options } from "./_helpers";

export const listingCar = defineTemplate({
  key: "listing_car",
  name: "গাড়ি (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: cars",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "car",
        title: { bn: "গাড়ির তথ্য", en: "Car" },
        fields: [
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            placeholder: { bn: "যেমন: Toyota, Honda, Nissan" },
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
            label: { bn: "মডেল বছর", en: "Year" },
            summary: true,
            filterable: true,
            validation: { min: 1980, max: 2100 },
            width: "half",
          },
          {
            key: "kmRun",
            type: "number",
            label: { bn: "কত কিমি চলেছে", en: "Km run" },
            validation: { min: 0, max: 2000000 },
            width: "half",
          },
          {
            key: "fuel",
            type: "select",
            label: { bn: "জ্বালানি", en: "Fuel" },
            filterable: true,
            width: "half",
            options: options([
              ["petrol", "পেট্রোল", "Petrol"],
              ["octane", "অকটেন", "Octane"],
              ["diesel", "ডিজেল", "Diesel"],
              ["cng", "সিএনজি", "CNG"],
              ["hybrid", "হাইব্রিড", "Hybrid"],
            ]),
          },
          {
            key: "transmission",
            type: "select",
            label: { bn: "গিয়ার", en: "Transmission" },
            filterable: true,
            width: "half",
            options: options([
              ["auto", "অটো", "Automatic"],
              ["manual", "ম্যানুয়াল", "Manual"],
            ]),
          },
          {
            key: "regYear",
            type: "number",
            label: { bn: "রেজিস্ট্রেশনের বছর", en: "Registration year" },
            validation: { min: 1980, max: 2100 },
          },
          {
            key: "fitnessValid",
            type: "boolean",
            label: { bn: "ফিটনেস সার্টিফিকেট বৈধ", en: "Fitness valid" },
          },
        ],
      },
    ],
  },
});
