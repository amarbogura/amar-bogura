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
    rules: [
      {
        type: "requireOneOf",
        fields: ["roomCount", "areaSqft"],
        message: {
          bn: "রুমের সংখ্যা অথবা আনুমানিক বর্গফুট দিন।",
          en: "Enter the number of rooms or the approximate square feet.",
        },
      },
    ],
    sections: [
      {
        key: "job",
        title: { bn: "রঙের কাজ", en: "Painting job" },
        description: {
          bn: "রুমের সংখ্যা অথবা আনুমানিক বর্গফুট — যেকোনো একটি দিন।",
          en: "Give either the number of rooms or the approximate square feet.",
        },
        fields: [
          {
            key: "scope",
            type: "radio",
            label: { bn: "কোথায় রং করবেন", en: "Where do you want painting?" },
            required: true,
            summary: true,
            options: options([
              ["interior", "ভেতরে", "Inside"],
              ["exterior", "বাইরে", "Outside"],
              ["both", "ভেতরে ও বাইরে", "Inside and outside"],
            ]),
          },
          {
            key: "roomCount",
            type: "number",
            label: { bn: "রুমের সংখ্যা", en: "Number of rooms" },
            validation: { min: 1, max: 50 },
            width: "half",
          },
          {
            key: "areaSqft",
            type: "number",
            label: { bn: "আনুমানিক বর্গফুট", en: "Approx. square feet" },
            validation: { min: 50, max: 100000 },
            width: "half",
          },
          {
            key: "surface",
            type: "radio",
            label: { bn: "দেয়ালের অবস্থা", en: "Wall condition" },
            options: options([
              ["new_wall", "নতুন দেয়াল", "New wall"],
              ["repaint", "পুরাতন রং এর উপর", "Over old paint"],
            ]),
          },
          {
            key: "paintSupply",
            type: "radio",
            label: { bn: "রং কে কিনবে", en: "Who buys the paint?" },
            required: true,
            options: options([
              ["self", "আমি দেব", "I will"],
              ["provider", "আপনারা ব্যবস্থা করবেন", "You arrange it"],
            ]),
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
