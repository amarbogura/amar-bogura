import { defineTemplate, ON_SITE_COMMON, options } from "./_helpers";

const isRepair = { field: "variant", op: "eq", value: "repair" } as const;

/** Shared by washing machine repair and installation; `variant` pinned per service. */
export const washingMachine = defineTemplate({
  key: "washing_machine",
  name: "ওয়াশিং মেশিন সার্ভিস",
  kind: "REQUEST",
  description: "Washing machine repair / installation (variant pinned per service)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "machine",
        title: { bn: "মেশিনের তথ্য", en: "Machine details" },
        fields: [
          {
            key: "variant",
            type: "select",
            label: { bn: "কী সার্ভিস দরকার", en: "Service needed" },
            required: true,
            summary: true,
            options: options([
              ["repair", "মেরামত", "Repair"],
              ["installation", "সেটআপ / ইনস্টলেশন", "Installation"],
            ]),
          },
          {
            key: "machineType",
            type: "radio",
            label: { bn: "মেশিনের ধরন", en: "Machine type" },
            required: true,
            summary: true,
            options: options([
              ["front_load", "ফ্রন্ট লোড", "Front load"],
              ["top_load", "টপ লোড", "Top load"],
              ["semi_auto", "সেমি-অটো (টুইন টাব)", "Semi-auto"],
            ]),
          },
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            validation: { maxLength: 50 },
            width: "half",
          },
          {
            key: "capacityKg",
            type: "number",
            label: { bn: "ক্ষমতা (কেজি)", en: "Capacity (kg)" },
            validation: { min: 1, max: 30 },
            width: "half",
          },
          {
            key: "problem",
            type: "textarea",
            label: { bn: "কী সমস্যা হচ্ছে", en: "Problem" },
            required: true,
            validation: { maxLength: 500 },
            showIf: isRepair,
          },
          {
            key: "errorCode",
            type: "text",
            label: { bn: "ডিসপ্লেতে কোনো এরর কোড দেখাচ্ছে?", en: "Error code" },
            placeholder: { bn: "যেমন: E21" },
            validation: { maxLength: 20 },
            showIf: isRepair,
          },
          {
            key: "waterPointReady",
            type: "boolean",
            label: { bn: "পানির লাইন ও ড্রেন প্রস্তুত আছে", en: "Water point ready" },
            showIf: { field: "variant", op: "eq", value: "installation" },
          },
        ],
      },
    ],
  },
});
