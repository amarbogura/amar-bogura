import { defineTemplate, options } from "./_helpers";

/** Milk, vegetables, local products, packaged grocery, daily essentials (D-05: no cart, COD). */
export const groceryOrder = defineTemplate({
  key: "grocery_order",
  name: "বাজার-সদাই অর্ডার",
  kind: "REQUEST",
  description: "Grocery / local products order with item list and frequency",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "required",
      preferredTimeSlot: "required",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    sections: [
      {
        key: "items",
        title: { bn: "কী কী লাগবে", en: "Items" },
        description: { bn: "প্রথম ডেলিভারির তারিখ শেষ ধাপে দেবেন। পেমেন্ট ক্যাশ অন ডেলিভারি।" },
        fields: [
          {
            key: "items",
            type: "item_list",
            label: { bn: "পণ্যের তালিকা", en: "Item list" },
            required: true,
            summary: true,
            validation: {
              min: 1,
              max: 40,
              units: ["kg", "g", "litre", "piece", "packet", "dozen", "hali"],
            },
          },
          {
            key: "frequency",
            type: "radio",
            label: { bn: "কত দিন পরপর", en: "Frequency" },
            required: true,
            summary: true,
            options: options([
              ["one_time", "একবার", "One-time"],
              ["daily", "প্রতিদিন", "Daily"],
              ["weekly", "সপ্তাহে একবার", "Weekly"],
              ["monthly", "মাসে একবার", "Monthly"],
            ]),
          },
          {
            key: "durationDays",
            type: "number",
            label: { bn: "কত দিন ধরে নেবেন", en: "Duration (days)" },
            placeholder: { bn: "যেমন: ৩০" },
            validation: { min: 1, max: 365 },
            showIf: { field: "frequency", op: "neq", value: "one_time" },
          },
          {
            key: "substitution",
            type: "radio",
            label: { bn: "কোনো পণ্য না পেলে", en: "If unavailable" },
            options: options([
              ["call", "আমাকে ফোন করবেন", "Call me"],
              ["similar", "কাছাকাছি পণ্য দেবেন", "Substitute similar"],
              ["skip", "বাদ দেবেন", "Skip item"],
            ]),
          },
          {
            key: "budgetMax",
            type: "money",
            label: { bn: "সর্বোচ্চ বাজেট (টাকা)", en: "Max budget" },
            validation: { min: 1 },
          },
        ],
      },
    ],
  },
});
