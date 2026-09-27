import { defineTemplate, options } from "./_helpers";

/** Emergency ambulance (EMERGENCY priority). The page shows a Call-now button above this form. */
export const ambulance = defineTemplate({
  key: "ambulance",
  name: "অ্যাম্বুলেন্স",
  kind: "REQUEST",
  description: "Emergency ambulance — shortest possible form",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "hidden",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    submitLabel: { bn: "অ্যাম্বুলেন্স চাই", en: "Request ambulance" },
    sections: [
      {
        key: "ambulance",
        title: { bn: "অ্যাম্বুলেন্সের তথ্য", en: "Ambulance" },
        fields: [
          {
            key: "when",
            type: "radio",
            label: { bn: "কখন লাগবে", en: "When" },
            required: true,
            defaultValue: "now",
            options: options([
              ["now", "এখনই", "Now"],
              ["scheduled", "নির্দিষ্ট সময়ে", "Scheduled"],
            ]),
          },
          {
            key: "scheduledAt",
            type: "datetime",
            label: { bn: "তারিখ ও সময়", en: "Scheduled at" },
            required: true,
            showIf: { field: "when", op: "eq", value: "scheduled" },
          },
          {
            key: "ambulanceType",
            type: "radio",
            label: { bn: "অ্যাম্বুলেন্সের ধরন", en: "Ambulance type" },
            required: true,
            summary: true,
            options: options([
              ["non_ac", "নন-এসি", "Non-AC"],
              ["ac", "এসি", "AC"],
              ["icu", "আইসিইউ", "ICU"],
              ["oxygen", "অক্সিজেন সাপোর্ট", "Oxygen support"],
              ["freezer", "ফ্রিজার (লাশবাহী)", "Freezer"],
            ]),
          },
          {
            key: "route",
            type: "route",
            label: { bn: "কোথা থেকে কোথায়", en: "Pickup → destination" },
            help: { bn: "গন্তব্য হাসপাতাল বা শহরের নাম লিখুন (যেমন: শজিমেক, ঢাকা)।" },
            required: true,
          },
          {
            key: "patientCondition",
            type: "text",
            label: { bn: "রোগীর অবস্থা (সংক্ষেপে)", en: "Patient condition" },
            validation: { maxLength: 150 },
          },
        ],
      },
    ],
  },
});
