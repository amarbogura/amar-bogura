import { defineTemplate, ON_SITE_COMMON, options, URGENCY_OPTIONS } from "./_helpers";

export const electrician = defineTemplate({
  key: "electrician",
  name: "ইলেকট্রিশিয়ান",
  kind: "REQUEST",
  description: "Electrician",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "problem",
        title: { bn: "কী কাজ করাতে চান", en: "What work do you need?" },
        fields: [
          {
            key: "problemTypes",
            type: "checkboxes",
            label: { bn: "কাজের ধরন", en: "Type of work" },
            required: true,
            summary: true,
            options: options([
              ["new_wiring", "নতুন ওয়্যারিং", "New wiring"],
              ["repair_wiring", "ওয়্যারিং মেরামত", "Wiring repair"],
              ["switch_socket", "সুইচ / সকেট", "Switch / socket"],
              ["fan", "ফ্যান লাগানো / মেরামত", "Fan install / repair"],
              ["light", "লাইট ফিটিং", "Light fitting"],
              ["ips", "আইপিএস / ইনভার্টার", "IPS / inverter"],
              ["meter_breaker", "মিটার / ব্রেকার", "Meter / breaker"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "description",
            type: "textarea",
            label: { bn: "সমস্যার বিবরণ", en: "Describe the problem" },
            placeholder: {
              bn: "যেমন: বেডরুমের ২টা সকেটে বিদ্যুৎ নেই",
              en: "e.g. two sockets in the bedroom have no power",
            },
            required: true,
            validation: { maxLength: 500 },
          },
          {
            key: "urgency",
            type: "radio",
            label: { bn: "কত দ্রুত দরকার", en: "How soon do you need it?" },
            required: true,
            summary: true,
            options: URGENCY_OPTIONS,
          },
        ],
      },
    ],
  },
});
