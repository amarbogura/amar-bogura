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
        title: { bn: "কী কী লাগবে", en: "What do you need?" },
        description: {
          bn: "প্রথম ডেলিভারির তারিখ শেষ ধাপে দেবেন। পেমেন্ট ক্যাশ অন ডেলিভারি।",
          en: "You'll choose the first delivery date in the last step. Payment is cash on delivery.",
        },
        fields: [
          {
            key: "items",
            type: "item_list",
            label: { bn: "পণ্যের তালিকা", en: "List of items" },
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
            label: { bn: "কত দিন পরপর", en: "How often?" },
            required: true,
            summary: true,
            options: options([
              ["one_time", "একবার", "One-time"],
              ["daily", "প্রতিদিন", "Daily"],
              ["weekly", "সপ্তাহে একবার", "Weekly"],
              ["monthly", "মাসে একবার", "Once a month"],
            ]),
          },
          {
            key: "durationDays",
            type: "number",
            label: { bn: "কত দিন ধরে নেবেন", en: "For how many days?" },
            placeholder: { bn: "যেমন: ৩০", en: "e.g. 30" },
            validation: { min: 1, max: 365 },
            showIf: { field: "frequency", op: "neq", value: "one_time" },
          },
          {
            key: "substitution",
            type: "radio",
            label: { bn: "কোনো পণ্য না পেলে", en: "If an item isn't available" },
            options: options([
              ["call", "আমাকে ফোন করবেন", "Call me"],
              ["similar", "কাছাকাছি পণ্য দেবেন", "Give a similar item"],
              ["skip", "বাদ দেবেন", "Leave it out"],
            ]),
          },
          {
            key: "budgetMax",
            type: "money",
            label: { bn: "সর্বোচ্চ বাজেট (টাকা)", en: "Maximum budget (taka)" },
            validation: { min: 1 },
          },
        ],
      },
    ],
  },
});
