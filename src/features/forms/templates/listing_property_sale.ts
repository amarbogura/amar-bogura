import { defineTemplate, options } from "./_helpers";

/**
 * Property for sale. propertyType, size + sizeUnit, bedrooms and price are promoted Listing
 * columns; LAND hides bedrooms/bathrooms (handled by the listing form in P10).
 */
export const listingPropertySale = defineTemplate({
  key: "listing_property_sale",
  name: "বিক্রয় (প্রপার্টি বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Property for sale — extra attributes",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "details",
        title: { bn: "প্রপার্টির বিস্তারিত", en: "Details" },
        fields: [
          {
            key: "roadWidthFt",
            type: "number",
            label: { bn: "সামনের রাস্তা কত ফুট", en: "Road width (ft)" },
            validation: { min: 1, max: 200 },
            width: "half",
          },
          {
            key: "landType",
            type: "select",
            label: { bn: "জমির ধরন", en: "Land type" },
            width: "half",
            options: options([
              ["residential", "আবাসিক", "Residential"],
              ["commercial", "বাণিজ্যিক", "Commercial"],
              ["agricultural", "কৃষি", "Agricultural"],
            ]),
          },
          {
            key: "ownershipDocs",
            type: "checkboxes",
            label: { bn: "যেসব কাগজ আছে", en: "Ownership documents" },
            options: options([
              ["dolil", "দলিল", "Deed"],
              ["khatian", "খতিয়ান", "Khatian"],
              ["namjari", "নামজারি", "Mutation"],
              ["khajna", "খাজনা হালনাগাদ", "Land tax updated"],
            ]),
          },
          {
            key: "facing",
            type: "select",
            label: { bn: "কোন দিকে মুখ", en: "Facing" },
            width: "half",
            options: options([
              ["north", "উত্তর", "North"],
              ["south", "দক্ষিণ", "South"],
              ["east", "পূর্ব", "East"],
              ["west", "পশ্চিম", "West"],
            ]),
          },
          {
            key: "floor",
            type: "number",
            label: { bn: "কত তলায় (ফ্ল্যাট হলে)", en: "Floor" },
            validation: { min: 0, max: 50 },
            width: "half",
          },
        ],
      },
    ],
  },
});
