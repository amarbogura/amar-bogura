import { defineTemplate, options } from "./_helpers";

/** Custom request (D-07): `title` is a ServiceRequest column (common field), required here. */
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
      title: "required",
    },
    sections: [
      {
        key: "request",
        title: { bn: "আপনার কী দরকার", en: "What do you need?" },
        fields: [
          {
            key: "description",
            type: "textarea",
            label: { bn: "বিস্তারিত লিখুন", en: "Describe it" },
            placeholder: {
              bn: "কী দরকার, কখন, কোথায় — যত বিস্তারিত লিখবেন তত দ্রুত সাহায্য করতে পারব।",
              en: "What you need, when and where — the more detail, the faster we can help.",
            },
            required: true,
            validation: { minLength: 20, maxLength: 1000 },
          },
          {
            key: "categoryHint",
            type: "select",
            label: { bn: "কোন ধরনের কাজ", en: "What kind of work is it?" },
            options: options([
              ["home-office", "হোম ও অফিস সার্ভিস", "Home & office services"],
              ["rent-a-vehicle", "গাড়ি ভাড়া", "Vehicle rental"],
              ["courier-delivery", "কুরিয়ার ও ডেলিভারি", "Courier & delivery"],
              ["local-products-grocery", "লোকাল পণ্য ও বাজার", "Local products & groceries"],
              ["bazar-medicine", "বাজার ও ওষুধ", "Bazar & medicine"],
              ["wedding-event", "বিয়ে ও অনুষ্ঠান", "Weddings & events"],
              ["education", "শিক্ষা", "Education"],
              ["it-digital", "আইটি ও ডিজিটাল", "IT & digital"],
              ["other", "অন্য কিছু", "Something else"],
            ]),
          },
          {
            key: "budget",
            type: "money",
            label: { bn: "আনুমানিক বাজেট (টাকা)", en: "Approximate budget (taka)" },
            validation: { min: 1 },
          },
        ],
      },
    ],
  },
});
