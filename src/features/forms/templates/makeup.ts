import { defineTemplate, EVENT_BUDGET_OPTIONS, options } from "./_helpers";

export const makeup = defineTemplate({
  key: "makeup",
  name: "মেকআপ আর্টিস্ট",
  kind: "REQUEST",
  description: "Makeup artist",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "optional",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "optional",
      altPhone: "optional",
    },
    sections: [
      {
        key: "makeup",
        title: { bn: "মেকআপের তথ্য", en: "Makeup details" },
        fields: [
          {
            key: "lookType",
            type: "select",
            label: { bn: "কোন অনুষ্ঠানের সাজ", en: "For which occasion?" },
            required: true,
            summary: true,
            options: options([
              ["bridal", "ব্রাইডাল", "Bridal"],
              ["holud", "গায়ে হলুদ", "Gaye holud"],
              ["reception", "রিসেপশন", "Reception"],
              ["party", "পার্টি", "Party"],
              ["engagement", "এনগেজমেন্ট", "Engagement"],
            ]),
          },
          {
            key: "persons",
            type: "number",
            label: { bn: "কতজনের মেকআপ", en: "How many people?" },
            required: true,
            defaultValue: 1,
            validation: { min: 1, max: 30 },
          },
          {
            key: "location",
            type: "radio",
            label: { bn: "কোথায়", en: "Where?" },
            required: true,
            help: {
              bn: "হোম সার্ভিস হলে শেষ ধাপে ঠিকানা দিন।",
              en: "For a home service, add the address in the last step.",
            },
            options: options([
              ["home", "বাসায় এসে (হোম সার্ভিস)", "At my home (home service)"],
              ["studio", "পার্লার / স্টুডিওতে", "At the parlour / studio"],
            ]),
          },
          {
            key: "eventDate",
            type: "date",
            label: { bn: "তারিখ", en: "Date" },
            required: true,
            summary: true,
            width: "half",
          },
          {
            key: "startTime",
            type: "time",
            label: { bn: "কখন শুরু করবেন", en: "Start time" },
            required: true,
            width: "half",
          },
          {
            key: "budgetRange",
            type: "select",
            label: { bn: "বাজেট", en: "Budget" },
            options: EVENT_BUDGET_OPTIONS,
          },
        ],
      },
    ],
  },
});
