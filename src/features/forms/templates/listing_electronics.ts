import { defineTemplate, LISTING_WARRANTY_OPTIONS, options } from "./_helpers";

export const listingElectronics = defineTemplate({
  key: "listing_electronics",
  name: "ইলেকট্রনিক্স (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: electronics and home appliances",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "item",
        title: { bn: "পণ্যের তথ্য", en: "Item details" },
        fields: [
          {
            key: "itemType",
            type: "select",
            label: { bn: "পণ্যের ধরন", en: "Type of item" },
            required: true,
            summary: true,
            filterable: true,
            options: options([
              ["tv", "টিভি", "TV"],
              ["fridge", "ফ্রিজ", "Fridge"],
              ["ac", "এসি", "AC"],
              ["washing_machine", "ওয়াশিং মেশিন", "Washing machine"],
              ["ips", "আইপিএস", "IPS"],
              ["fan", "ফ্যান", "Fan"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            filterable: true,
            validation: { maxLength: 40 },
            width: "half",
          },
          {
            key: "model",
            type: "text",
            label: { bn: "মডেল", en: "Model" },
            validation: { maxLength: 60 },
            width: "half",
          },
          {
            key: "warrantyLeft",
            type: "select",
            label: { bn: "ওয়ারেন্টি বাকি", en: "Warranty remaining" },
            options: LISTING_WARRANTY_OPTIONS,
          },
        ],
      },
    ],
  },
});
