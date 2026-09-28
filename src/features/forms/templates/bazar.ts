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
        message: {
          bn: "বাজারের তালিকা লিখুন অথবা লিস্টের ছবি দিন।",
          en: "Type the list or add a photo of it.",
        },
      },
    ],
    sections: [
      {
        key: "list",
        title: { bn: "বাজারের তালিকা", en: "Shopping list" },
        description: {
          bn: "তালিকা লিখে দিন অথবা হাতে লেখা লিস্টের ছবি দিন — যেকোনো একটি।",
          en: "Type the list or add a photo of a handwritten list — either one.",
        },
        fields: [
          {
            key: "bazarType",
            type: "select",
            label: { bn: "বাজারের ধরন", en: "Type of shopping" },
            required: true,
            summary: true,
            options: options([
              ["monthly", "মাসিক বাজার", "Monthly shopping"],
              ["on_demand", "যখন দরকার", "When needed"],
            ]),
          },
          {
            key: "items",
            type: "item_list",
            label: { bn: "পণ্যের তালিকা", en: "List of items" },
            validation: {
              min: 1,
              max: 60,
              units: ["kg", "g", "litre", "piece", "packet", "dozen", "hali"],
            },
          },
          {
            key: "listPhoto",
            type: "images",
            label: { bn: "লিস্টের ছবি", en: "Photo of the list" },
            validation: { maxFiles: 2 },
          },
          {
            key: "familySize",
            type: "number",
            label: { bn: "পরিবারের সদস্য সংখ্যা", en: "Family members" },
            validation: { min: 1, max: 30 },
            width: "half",
            showIf: isMonthly,
          },
          {
            key: "deliverySchedule",
            type: "select",
            label: { bn: "মাসে কতবার", en: "How many times a month?" },
            width: "half",
            showIf: isMonthly,
            options: options([
              ["once", "মাসে একবার", "Once a month"],
              ["twice", "মাসে দুইবার", "Twice a month"],
              ["weekly", "প্রতি সপ্তাহে", "Every week"],
            ]),
          },
          {
            key: "preferredMarket",
            type: "text",
            label: { bn: "পছন্দের বাজার", en: "Preferred market" },
            placeholder: {
              bn: "যেমন: ফতেহ আলী বাজার, রাজাবাজার",
              en: "e.g. Fateh Ali Bazar, Rajabazar",
            },
            validation: { maxLength: 80 },
          },
          {
            key: "budget",
            type: "money",
            label: { bn: "বাজেট (টাকা)", en: "Budget (taka)" },
            required: true,
            summary: true,
            validation: { min: 100 },
          },
          {
            key: "advanceNote",
            type: "heading",
            label: {
              bn: "অগ্রিম টাকা ও পেমেন্টের বিষয়ে আমাদের প্রতিনিধি ফোনে নিশ্চিত করবেন।",
              en: "Our representative will confirm any advance and the payment by phone.",
            },
          },
        ],
      },
    ],
  },
});
