import { defineTemplate, ON_SITE_COMMON } from "./_helpers";

/** Fallback when a service has no template of its own (docs/02: resolution order). */
export const genericService = defineTemplate({
  key: "generic_service",
  name: "সাধারণ সার্ভিস রিকোয়েস্ট",
  kind: "REQUEST",
  description: "Generic fallback form for new services",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: { ...ON_SITE_COMMON, preferredTimeSlot: "optional" },
    sections: [
      {
        key: "request",
        title: { bn: "কী সাহায্য দরকার", en: "What help do you need?" },
        fields: [
          {
            key: "description",
            type: "textarea",
            label: { bn: "বিস্তারিত লিখুন", en: "Describe it" },
            required: true,
            summary: true,
            validation: { minLength: 10, maxLength: 1000 },
          },
        ],
      },
    ],
  },
});
