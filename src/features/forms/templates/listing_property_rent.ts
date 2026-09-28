import { defineTemplate, options } from "./_helpers";

/**
 * Property for rent. propertyType, bedrooms, bathrooms, size, availableFrom and monthly price are
 * promoted Listing columns (filterable); only extra attributes live here.
 */
export const listingPropertyRent = defineTemplate({
  key: "listing_property_rent",
  name: "ভাড়া (প্রপার্টি বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Property for rent — extra attributes",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "details",
        title: { bn: "বাসার বিস্তারিত", en: "Property details" },
        fields: [
          {
            key: "floor",
            type: "number",
            label: { bn: "কত তলায়", en: "Which floor?" },
            validation: { min: 0, max: 50 },
            width: "half",
          },
          {
            key: "totalFloors",
            type: "number",
            label: { bn: "ভবন কত তলা", en: "Floors in the building" },
            validation: { min: 1, max: 50 },
            width: "half",
          },
          {
            key: "balconies",
            type: "number",
            label: { bn: "বারান্দা", en: "Balconies" },
            validation: { min: 0, max: 10 },
            width: "half",
          },
          {
            key: "furnished",
            type: "select",
            label: { bn: "ফার্নিশড", en: "Furnished" },
            summary: true,
            filterable: true,
            width: "half",
            options: options([
              ["none", "ফার্নিচার ছাড়া", "Unfurnished"],
              ["semi", "আংশিক ফার্নিশড", "Semi-furnished"],
              ["full", "সম্পূর্ণ ফার্নিশড", "Fully furnished"],
            ]),
          },
          {
            key: "gas",
            type: "radio",
            label: { bn: "গ্যাস", en: "Gas" },
            options: options([
              ["line", "লাইনের গ্যাস", "Line gas"],
              ["cylinder", "সিলিন্ডার", "Cylinder"],
              ["none", "নেই", "None"],
            ]),
          },
          { key: "lift", type: "boolean", label: { bn: "লিফট আছে", en: "Has a lift" } },
          { key: "parking", type: "boolean", label: { bn: "পার্কিং আছে", en: "Has parking" } },
          {
            key: "tenantPref",
            type: "select",
            label: { bn: "কাদের ভাড়া দেবেন", en: "Who can rent it?" },
            summary: true,
            filterable: true,
            options: options([
              ["family", "পরিবার", "Family"],
              ["bachelor_male", "ব্যাচেলর (ছেলে)", "Bachelor (male)"],
              ["bachelor_female", "ব্যাচেলর (মেয়ে)", "Bachelor (female)"],
              ["any", "যেকোনো", "Either"],
            ]),
          },
          {
            key: "advanceMonths",
            type: "number",
            label: { bn: "কত মাসের অগ্রিম", en: "Advance (months)" },
            validation: { min: 0, max: 12 },
            width: "half",
          },
          {
            key: "serviceCharge",
            type: "money",
            label: { bn: "সার্ভিস চার্জ (মাসিক)", en: "Service charge (monthly)" },
            validation: { min: 0 },
            width: "half",
          },
        ],
      },
    ],
  },
});
