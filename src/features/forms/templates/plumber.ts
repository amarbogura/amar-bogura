import { defineTemplate, ON_SITE_COMMON, options, URGENCY_OPTIONS } from "./_helpers";

export const plumber = defineTemplate({
  key: "plumber",
  name: "প্লাম্বার",
  kind: "REQUEST",
  description: "Plumber",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "problem",
        title: { bn: "কী কাজ করাতে চান", en: "Work needed" },
        fields: [
          {
            key: "problemTypes",
            type: "checkboxes",
            label: { bn: "কাজের ধরন", en: "Work type" },
            required: true,
            summary: true,
            options: options([
              ["leak", "লিকেজ", "Leak"],
              ["pipe_line", "পাইপ লাইন", "Pipe line"],
              ["fixture_install", "বেসিন / কমোড লাগানো", "Basin / commode install"],
              ["pump", "পানির পাম্প / মোটর", "Water pump / motor"],
              ["tank", "পানির ট্যাংক", "Tank"],
              ["drain_block", "ড্রেন / লাইন জ্যাম", "Drain block"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "description",
            type: "textarea",
            label: { bn: "সমস্যার বিবরণ", en: "Description" },
            required: true,
            validation: { maxLength: 500 },
          },
          {
            key: "urgency",
            type: "radio",
            label: { bn: "কত দ্রুত দরকার", en: "Urgency" },
            required: true,
            summary: true,
            options: URGENCY_OPTIONS,
          },
        ],
      },
    ],
  },
});
