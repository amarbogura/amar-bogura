import { defineTemplate, EVENT_BUDGET_OPTIONS, EVENT_TYPE_OPTIONS, options } from "./_helpers";

export const eventDecoration = defineTemplate({
  key: "event_decoration",
  name: "ইভেন্ট ডেকোরেশন",
  kind: "REQUEST",
  description: "Event decoration",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    sections: [
      {
        key: "event",
        title: { bn: "অনুষ্ঠানের তথ্য", en: "Event" },
        fields: [
          {
            key: "eventType",
            type: "select",
            label: { bn: "অনুষ্ঠানের ধরন", en: "Event type" },
            required: true,
            summary: true,
            options: EVENT_TYPE_OPTIONS,
          },
          {
            key: "venueType",
            type: "select",
            label: { bn: "ভেন্যুর ধরন", en: "Venue type" },
            required: true,
            options: options([
              ["home", "বাসা", "Home"],
              ["rooftop", "ছাদ", "Rooftop"],
              ["community_centre", "কমিউনিটি সেন্টার", "Community centre"],
              ["convention_hall", "কনভেনশন হল", "Convention hall"],
              ["outdoor", "খোলা জায়গা", "Outdoor"],
            ]),
          },
          {
            key: "eventDate",
            type: "date",
            label: { bn: "অনুষ্ঠানের তারিখ", en: "Event date" },
            required: true,
            summary: true,
            width: "half",
          },
          {
            key: "guestCount",
            type: "number",
            label: { bn: "আনুমানিক অতিথি", en: "Guests" },
            validation: { min: 1, max: 5000 },
            width: "half",
          },
        ],
      },
      {
        key: "decor",
        title: { bn: "ডেকোরেশন", en: "Decoration" },
        fields: [
          {
            key: "elements",
            type: "checkboxes",
            label: { bn: "কী কী লাগবে", en: "Elements" },
            options: options([
              ["stage", "স্টেজ", "Stage"],
              ["gate", "গেট", "Gate"],
              ["lighting", "লাইটিং", "Lighting"],
              ["flower", "ফুলের সাজ", "Flower"],
              ["photo_booth", "ফটো বুথ", "Photo booth"],
              ["table_decor", "টেবিল ডেকোর", "Table decor"],
            ]),
          },
          {
            key: "theme",
            type: "text",
            label: { bn: "থিম / রঙ", en: "Theme" },
            placeholder: { bn: "যেমন: হলুদ-সবুজ, রাস্টিক" },
            validation: { maxLength: 80 },
          },
          {
            key: "budgetRange",
            type: "select",
            label: { bn: "বাজেট", en: "Budget" },
            required: true,
            summary: true,
            options: EVENT_BUDGET_OPTIONS,
          },
          {
            key: "referencePhotos",
            type: "images",
            label: { bn: "পছন্দের ডেকোরেশনের ছবি", en: "Reference photos" },
            validation: { maxFiles: 4 },
          },
        ],
      },
    ],
  },
});
