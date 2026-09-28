import { defineTemplate, ON_SITE_COMMON, options } from "./_helpers";

export const cctv = defineTemplate({
  key: "cctv",
  name: "সিসিটিভি ইনস্টলেশন",
  kind: "REQUEST",
  description: "CCTV installation",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "setup",
        title: { bn: "ক্যামেরা সেটআপ", en: "Camera setup" },
        fields: [
          {
            key: "premise",
            type: "radio",
            label: { bn: "কোথায় লাগাবেন", en: "Where will it be installed?" },
            required: true,
            summary: true,
            options: options([
              ["home", "বাসা", "Home"],
              ["shop", "দোকান", "Shop"],
              ["office", "অফিস", "Office"],
              ["factory", "কারখানা", "Factory"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "cameraCount",
            type: "number",
            label: { bn: "কয়টি ক্যামেরা", en: "How many cameras?" },
            required: true,
            summary: true,
            validation: { min: 1, max: 64 },
          },
          {
            key: "cameraType",
            type: "radio",
            label: { bn: "ক্যামেরার ধরন", en: "Camera type" },
            options: options([
              ["ip", "আইপি ক্যামেরা", "IP camera"],
              ["analog", "অ্যানালগ", "Analog"],
              ["advise", "পরামর্শ দিন", "Please advise"],
            ]),
          },
          {
            key: "recorder",
            type: "boolean",
            label: { bn: "DVR/NVR লাগবে", en: "Need a DVR/NVR recorder" },
          },
          {
            key: "mobileView",
            type: "boolean",
            label: { bn: "মোবাইলে লাইভ দেখতে চাই", en: "I want live view on my phone" },
          },
          {
            key: "existingSetup",
            type: "boolean",
            label: { bn: "আগে থেকে কিছু সেটআপ আছে", en: "There is an existing setup" },
          },
          {
            key: "siteVisit",
            type: "boolean",
            label: {
              bn: "আগে পরিদর্শন করে দাম জানাতে চাই",
              en: "I'd like a site visit before the quote",
            },
            defaultValue: true,
          },
        ],
      },
    ],
  },
});
