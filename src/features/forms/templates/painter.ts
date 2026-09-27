import { defineTemplate, ON_SITE_COMMON, options } from "./_helpers";

export const painter = defineTemplate({
  key: "painter",
  name: "রং মিস্ত্রি / পেইন্টার",
  kind: "REQUEST",
  description: "Painter",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "job",
        title: { bn: "রঙের কাজ", en: "Painting job" },
        description: { bn: "রুমের সংখ্যা অথবা আনুমানিক বর্গফুট — যেকোনো একটি দিন।" },
        fields: [
          {
            key: "scope",
            type: "radio",
            label: { bn: "কোথায় রং করবেন", en: "Scope" },
            required: true,
            summary: true,
            options: options([
              ["interior", "ভেতরে", "Interior"],
              ["exterior", "বাইরে", "Exterior"],
              ["both", "ভেতরে ও বাইরে", "Both"],
            ]),
          },
          // Cross-field rule (P6 superRefine): roomCount OR areaSqft is required.
          {
            key: "roomCount",
            type: "number",
            label: { bn: "রুমের সংখ্যা", en: "Rooms" },
            validation: { min: 1, max: 50 },
            width: "half",
          },
          {
            key: "areaSqft",
            type: "number",
            label: { bn: "আনুমানিক বর্গফুট", en: "Area (sqft)" },
            validation: { min: 50, max: 100000 },
            width: "half",
          },
          {
            key: "surface",
            type: "radio",
            label: { bn: "দেয়ালের অবস্থা", en: "Surface" },
            options: options([
              ["new_wall", "নতুন দেয়াল", "New wall"],
              ["repaint", "পুরাতন রং এর উপর", "Repaint"],
            ]),
          },
          {
            key: "paintSupply",
            type: "radio",
            label: { bn: "রং কে কিনবে", en: "Paint supply" },
            required: true,
            options: options([
              ["self", "আমি দেব", "I provide"],
              ["provider", "আপনারা ব্যবস্থা করবেন", "You arrange"],
            ]),
          },
          {
            key: "siteVisit",
            type: "boolean",
            label: { bn: "আগে পরিদর্শন করে দাম জানাতে চাই", en: "Site visit before quote" },
            defaultValue: true,
          },
        ],
      },
    ],
  },
});
