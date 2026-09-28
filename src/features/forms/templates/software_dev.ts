import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const softwareDev = digitalTemplate(
  { key: "software_dev", name: "সফটওয়্যার তৈরি", description: "Software / app development" },
  {
    key: "software",
    title: { bn: "সফটওয়্যারের তথ্য", en: "Software details" },
    fields: [
      {
        key: "platform",
        type: "checkboxes",
        label: { bn: "কোন প্ল্যাটফর্মে", en: "Which platform(s)?" },
        summary: true,
        options: options([
          ["web", "ওয়েব", "Web"],
          ["android", "অ্যান্ড্রয়েড", "Android"],
          ["ios", "আইফোন (iOS)", "iPhone (iOS)"],
          ["desktop", "ডেস্কটপ", "Desktop"],
        ]),
      },
      {
        key: "description",
        type: "textarea",
        label: { bn: "সফটওয়্যারে কী কী থাকবে", en: "What should the software do?" },
        placeholder: {
          bn: "যেমন: দোকানের স্টক ও বিক্রির হিসাব, মাসিক রিপোর্ট",
          en: "e.g. shop stock and sales records, monthly reports",
        },
        required: true,
        validation: { minLength: 50, maxLength: 2000 },
      },
    ],
  },
);
