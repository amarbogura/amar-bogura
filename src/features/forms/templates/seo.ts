import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const seo = digitalTemplate(
  { key: "seo", name: "এসইও (SEO)", description: "Search engine optimisation" },
  {
    key: "seo",
    title: { bn: "ওয়েবসাইটের তথ্য", en: "Website" },
    fields: [
      {
        key: "websiteUrl",
        type: "url",
        label: { bn: "ওয়েবসাইটের লিংক", en: "Website URL" },
        required: true,
        summary: true,
      },
      {
        key: "targetKeywords",
        type: "textarea",
        label: { bn: "কোন কোন কীওয়ার্ডে র‍্যাঙ্ক করতে চান", en: "Target keywords" },
        placeholder: { bn: "যেমন: bogura doi, বগুড়ার দই" },
        validation: { maxLength: 500 },
      },
      {
        key: "targetArea",
        type: "radio",
        label: { bn: "কোন এলাকার কাস্টমার", en: "Target area" },
        options: options([
          ["bogura", "বগুড়া", "Bogura"],
          ["bangladesh", "সারা বাংলাদেশ", "Bangladesh"],
          ["global", "বিশ্বব্যাপী", "Global"],
        ]),
      },
    ],
  },
);
