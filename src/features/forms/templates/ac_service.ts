import { defineTemplate, ON_SITE_COMMON, options } from "./_helpers";

const isRepair = { field: "variant", op: "eq", value: "repair" } as const;
const isCleaning = { field: "variant", op: "eq", value: "cleaning" } as const;
const isInstallation = { field: "variant", op: "eq", value: "installation" } as const;

/** Shared by AC repair / cleaning / installation; each service pins `variant` via formPresets. */
export const acService = defineTemplate({
  key: "ac_service",
  name: "এসি সার্ভিস",
  kind: "REQUEST",
  description: "AC repair, cleaning and installation (variant pinned per service)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: ON_SITE_COMMON,
    sections: [
      {
        key: "ac",
        title: { bn: "এসির তথ্য", en: "AC details" },
        fields: [
          {
            key: "variant",
            type: "select",
            label: { bn: "কী সার্ভিস দরকার", en: "Which service do you need?" },
            required: true,
            summary: true,
            options: options([
              ["repair", "মেরামত", "Repair"],
              ["cleaning", "ক্লিনিং / ওয়াশ", "Cleaning"],
              ["installation", "ইনস্টলেশন", "Installation"],
            ]),
          },
          {
            key: "acType",
            type: "radio",
            label: { bn: "এসির ধরন", en: "AC type" },
            required: true,
            summary: true,
            options: options([
              ["split", "স্প্লিট", "Split"],
              ["window", "উইন্ডো", "Window"],
              ["cassette", "ক্যাসেট", "Cassette"],
              ["portable", "পোর্টেবল", "Portable"],
            ]),
          },
          {
            key: "capacity",
            type: "select",
            label: { bn: "ক্ষমতা (টন)", en: "Capacity (ton)" },
            required: true,
            summary: true,
            width: "half",
            options: options([
              ["1", "১ টন", "1 ton"],
              ["1.5", "১.৫ টন", "1.5 ton"],
              ["2", "২ টন", "2 ton"],
              ["2.5_plus", "২.৫ টন বা বেশি", "2.5+ ton"],
              ["unknown", "জানি না", "Don't know"],
            ]),
          },
          {
            key: "unitCount",
            type: "number",
            label: { bn: "কয়টি এসি", en: "How many ACs?" },
            required: true,
            summary: true,
            defaultValue: 1,
            validation: { min: 1, max: 20 },
            width: "half",
          },
          {
            key: "brand",
            type: "text",
            label: { bn: "ব্র্যান্ড", en: "Brand" },
            placeholder: { bn: "যেমন: Gree, Walton, General", en: "e.g. Gree, Walton, General" },
            validation: { maxLength: 50 },
          },
        ],
      },
      {
        key: "job",
        title: { bn: "কাজের বিবরণ", en: "Job details" },
        fields: [
          {
            key: "problem",
            type: "textarea",
            label: { bn: "কী সমস্যা হচ্ছে", en: "What's the problem?" },
            placeholder: {
              bn: "যেমন: ঠান্ডা হচ্ছে না, পানি পড়ছে",
              en: "e.g. not cooling, leaking water",
            },
            required: true,
            validation: { maxLength: 500 },
            showIf: isRepair,
          },
          {
            key: "lastServiced",
            type: "select",
            label: { bn: "শেষ কবে সার্ভিস করানো হয়েছে", en: "When was it last serviced?" },
            showIf: isCleaning,
            options: options([
              ["lt_6m", "৬ মাসের মধ্যে", "Within 6 months"],
              ["6_12m", "৬–১২ মাস আগে", "6–12 months ago"],
              ["gt_1y", "১ বছরের বেশি আগে", "More than a year ago"],
              ["never", "কখনো করানো হয়নি", "Never"],
            ]),
          },
          {
            key: "installKind",
            type: "radio",
            label: { bn: "ইনস্টলেশনের ধরন", en: "Type of installation" },
            required: true,
            showIf: isInstallation,
            options: options([
              ["new", "নতুন এসি", "New AC"],
              ["reinstall", "পুরাতন এসি (বাসা বদলের পর)", "Existing AC (after moving home)"],
            ]),
          },
          {
            key: "pipeProvided",
            type: "boolean",
            label: { bn: "পাইপ ও তার আমার কাছে আছে", en: "I have the pipe and cable" },
            showIf: isInstallation,
          },
          {
            key: "floor",
            type: "number",
            label: { bn: "কত তলায়", en: "Which floor?" },
            validation: { min: 0, max: 30 },
            width: "half",
          },
          {
            key: "outdoorPlacement",
            type: "radio",
            label: { bn: "আউটডোর ইউনিট কোথায় বসবে", en: "Where will the outdoor unit go?" },
            showIf: isInstallation,
            options: options([
              ["wall_bracket", "দেয়ালে ব্র্যাকেটে", "On a wall bracket"],
              ["roof", "ছাদে", "On the roof"],
              ["balcony", "বারান্দায়", "On the balcony"],
            ]),
          },
        ],
      },
    ],
  },
});
