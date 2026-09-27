import { defineTemplate, options } from "./_helpers";

const isMonthly = { field: "bazarType", op: "eq", value: "monthly" } as const;

/** Monthly bazar and bazar on demand; `bazarType` pinned per service. */
export const bazar = defineTemplate({
  key: "bazar",
  name: "বাজার করে দেওয়া",
  kind: "REQUEST",
  description: "Bazar shopping on your behalf (monthly / on demand)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "required",
      preferredTimeSlot: "optional",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    rules: [
      {
        type: "requireOneOf",
        fields: ["items", "listPhoto"],
        message: { bn: "বাজারের তালিকা লিখুন অথবা লিস্টের ছবি দিন।", en: "Add a list or a photo" },
      },
    ],
    sections: [
      {
        key: "list",
        title: { bn: "বাজারের তালিকা", en: "Shopping list" },
        description: { bn: "তালিকা লিখে দিন অথবা হাতে লেখা লিস্টের ছবি দিন — যেকোনো একটি।" },
        fields: [
          {
            key: "bazarType",
            type: "select",
            label: { bn: "বাজারের ধরন", en: "Bazar type" },
            required: true,
            summary: true,
            options: options([
              ["monthly", "মাসিক বাজার", "Monthly"],
              ["on_demand", "যখন দরকার", "On demand"],
            ]),
          },
          {
            key: "items",
            type: "item_list",
            label: { bn: "পণ্যের তালিকা", en: "Items" },
            validation: {
              min: 1,
              max: 60,
              units: ["kg", "g", "litre", "piece", "packet", "dozen", "hali"],
            },
          },
          {
            key: "listPhoto",
            type: "images",
            label: { bn: "লিস্টের ছবি", en: "List photo" },
            validation: { maxFiles: 2 },
          },
          {
            key: "familySize",
            type: "number",
            label: { bn: "পরিবারের সদস্য সংখ্যা", en: "Family size" },
            validation: { min: 1, max: 30 },
            width: "half",
            showIf: isMonthly,
          },
          {
            key: "deliverySchedule",
            type: "select",
            label: { bn: "মাসে কতবার", en: "Delivery schedule" },
            width: "half",
            showIf: isMonthly,
            options: options([
              ["once", "মাসে একবার", "Once"],
              ["twice", "মাসে দুইবার", "Twice"],
              ["weekly", "প্রতি সপ্তাহে", "Weekly"],
            ]),
          },
          {
            key: "preferredMarket",
            type: "text",
            label: { bn: "পছন্দের বাজার", en: "Preferred market" },
            placeholder: { bn: "যেমন: ফতেহ আলী বাজার, রাজাবাজার" },
            validation: { maxLength: 80 },
          },
          {
            key: "budget",
            type: "money",
            label: { bn: "বাজেট (টাকা)", en: "Budget" },
            required: true,
            summary: true,
            validation: { min: 100 },
          },
          {
            key: "advanceNote",
            type: "heading",
            label: {
              bn: "অগ্রিম টাকা ও পেমেন্টের বিষয়ে আমাদের প্রতিনিধি ফোনে নিশ্চিত করবেন।",
              en: "Advance/payment is confirmed on call",
            },
          },
        ],
      },
    ],
  },
});
