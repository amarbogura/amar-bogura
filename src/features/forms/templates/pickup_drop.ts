import { defineTemplate, options } from "./_helpers";

export const pickupDrop = defineTemplate({
  key: "pickup_drop",
  name: "লোকাল পিকআপ ও ড্রপ",
  kind: "REQUEST",
  description: "Local pick-up and drop of a person or item",
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
    sections: [
      {
        key: "trip",
        title: { bn: "পিকআপ ও ড্রপ", en: "Pick-up & drop" },
        fields: [
          {
            key: "what",
            type: "radio",
            label: { bn: "কাকে / কী নিতে হবে", en: "Who or what needs a ride?" },
            required: true,
            summary: true,
            options: options([
              ["person", "মানুষ", "A person"],
              ["item", "জিনিসপত্র", "Things"],
            ]),
          },
          {
            key: "route",
            type: "route",
            label: { bn: "কোথা থেকে কোথায়", en: "From where to where" },
            required: true,
          },
          {
            key: "startAt",
            type: "datetime",
            label: { bn: "কখন", en: "When?" },
            required: true,
            summary: true,
          },
          {
            key: "returnTrip",
            type: "boolean",
            label: { bn: "ফিরতি যাত্রাও লাগবে", en: "I need a return trip too" },
          },
          {
            key: "note",
            type: "textarea",
            label: { bn: "বিস্তারিত", en: "Details" },
            placeholder: {
              bn: "যেমন: স্কুল থেকে বাচ্চাকে বাসায় আনতে হবে",
              en: "e.g. bring my child home from school",
            },
            validation: { maxLength: 300 },
          },
        ],
      },
    ],
  },
});
