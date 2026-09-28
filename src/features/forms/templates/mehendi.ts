import { defineTemplate, options } from "./_helpers";

export const mehendi = defineTemplate({
  key: "mehendi",
  name: "মেহেদি আর্টিস্ট",
  kind: "REQUEST",
  description: "Mehendi artist",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "hidden",
      preferredTimeSlot: "optional",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    sections: [
      {
        key: "mehendi",
        title: { bn: "মেহেদির তথ্য", en: "Mehendi details" },
        fields: [
          {
            key: "persons",
            type: "number",
            label: { bn: "কতজনকে মেহেদি দেবেন", en: "How many people?" },
            required: true,
            summary: true,
            defaultValue: 1,
            validation: { min: 1, max: 50 },
          },
          {
            key: "design",
            type: "radio",
            label: { bn: "ডিজাইন", en: "Design" },
            required: true,
            summary: true,
            options: options([
              ["simple", "সাধারণ", "Simple"],
              ["medium", "মাঝারি", "Medium"],
              ["bridal_full", "ব্রাইডাল (হাত ও পা পুরো)", "Bridal (full hands and feet)"],
            ]),
          },
          {
            key: "eventDate",
            type: "date",
            label: { bn: "তারিখ", en: "Date" },
            required: true,
            summary: true,
          },
          {
            key: "referencePhotos",
            type: "images",
            label: { bn: "পছন্দের ডিজাইনের ছবি", en: "Photos of designs you like" },
            validation: { maxFiles: 4 },
          },
        ],
      },
    ],
  },
});
