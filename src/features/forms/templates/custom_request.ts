import { defineTemplate, options } from "./_helpers";

/** Custom request (D-07): `title` is a ServiceRequest column, required for type CUSTOM. */
export const customRequest = defineTemplate({
  key: "custom_request",
  name: "কাস্টম রিকোয়েস্ট",
  kind: "REQUEST",
  description: "Anything lawful that is not in the catalog",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "optional",
      preferredTimeSlot: "optional",
      notes: "hidden",
      photos: "optional",
      altPhone: "optional",
    },
    sections: [
      {
        key: "request",
        title: { bn: "আপনার কী দরকার", en: "Your request" },
        fields: [
          {
            key: "description",
            type: "textarea",
            label: { bn: "বিস্তারিত লিখুন", en: "Description" },
            placeholder: {
              bn: "কী দরকার, কখন, কোথায় — যত বিস্তারিত লিখবেন তত দ্রুত সাহায্য করতে পারব।",
            },
            required: true,
            validation: { minLength: 20, maxLength: 1000 },
          },
          {
            key: "categoryHint",
            type: "select",
            label: { bn: "কোন ধরনের কাজ", en: "Category hint" },
            options: options([
              ["home-office", "হোম ও অফিস সার্ভিস"],
              ["rent-a-vehicle", "গাড়ি ভাড়া"],
              ["courier-delivery", "কুরিয়ার ও ডেলিভারি"],
              ["local-products-grocery", "লোকাল পণ্য ও বাজার"],
              ["bazar-medicine", "বাজার ও ওষুধ"],
              ["wedding-event", "বিয়ে ও অনুষ্ঠান"],
              ["education", "শিক্ষা"],
              ["it-digital", "আইটি ও ডিজিটাল"],
              ["other", "অন্য কিছু"],
            ]),
          },
          {
            key: "budget",
            type: "money",
            label: { bn: "আনুমানিক বাজেট (টাকা)", en: "Budget" },
            validation: { min: 1 },
          },
        ],
      },
    ],
  },
});
