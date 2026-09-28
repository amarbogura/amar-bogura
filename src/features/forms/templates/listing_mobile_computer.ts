import { defineTemplate, LISTING_WARRANTY_OPTIONS, options } from "./_helpers";

export const listingMobileComputer = defineTemplate({
  key: "listing_mobile_computer",
  name: "মোবাইল ও কম্পিউটার (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: mobile, laptop, desktop, tablet, accessories",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "device",
        title: { bn: "ডিভাইসের তথ্য", en: "Device details" },
        fields: [
          {
            key: "deviceType",
            type: "select",
            label: { bn: "ডিভাইসের ধরন", en: "Device type" },
            required: true,
            summary: true,
            filterable: true,
            options: options([
              ["mobile", "মোবাইল", "Mobile"],
              ["laptop", "ল্যাপটপ", "Laptop"],
              ["desktop", "ডেস্কটপ", "Desktop"],
              ["tablet", "ট্যাবলেট", "Tablet"],
              ["accessory", "এক্সেসরিজ", "Accessories"],
            ]),
          },
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            placeholder: { bn: "যেমন: Samsung, Xiaomi, HP", en: "e.g. Samsung, Xiaomi, HP" },
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
            key: "ram",
            type: "text",
            label: { bn: "র‍্যাম", en: "RAM" },
            placeholder: { bn: "যেমন: 8GB", en: "e.g. 8GB" },
            validation: { maxLength: 20 },
            width: "half",
          },
          {
            key: "storage",
            type: "text",
            label: { bn: "স্টোরেজ", en: "Storage" },
            placeholder: { bn: "যেমন: 128GB", en: "e.g. 128GB" },
            validation: { maxLength: 20 },
            width: "half",
          },
          {
            key: "warrantyLeft",
            type: "select",
            label: { bn: "ওয়ারেন্টি বাকি", en: "Warranty remaining" },
            options: LISTING_WARRANTY_OPTIONS,
          },
          {
            key: "boxAvailable",
            type: "boolean",
            label: { bn: "বক্স আছে", en: "Comes with the box" },
          },
          {
            key: "accessories",
            type: "checkboxes",
            label: { bn: "সাথে যা যা আছে", en: "Comes with" },
            options: options([
              ["charger", "চার্জার", "Charger"],
              ["cable", "ক্যাবল", "Cable"],
              ["earphone", "ইয়ারফোন", "Earphone"],
              ["cover", "কভার", "Cover"],
              ["receipt", "ক্রয়ের রসিদ", "Purchase receipt"],
            ]),
          },
          {
            key: "purchaseYear",
            type: "number",
            label: { bn: "কেনার বছর", en: "Year bought" },
            validation: { min: 2000, max: 2100 },
          },
        ],
      },
    ],
  },
});
