import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const influencer = digitalTemplate(
  { key: "influencer", name: "ইনফ্লুয়েন্সার মার্কেটিং", description: "Influencer marketing" },
  {
    key: "campaign",
    title: { bn: "ক্যাম্পেইনের তথ্য", en: "Campaign" },
    fields: [
      {
        key: "platforms",
        type: "checkboxes",
        label: { bn: "কোন প্ল্যাটফর্মে", en: "Platforms" },
        required: true,
        summary: true,
        options: options([
          ["facebook", "ফেসবুক", "Facebook"],
          ["youtube", "ইউটিউব", "YouTube"],
          ["tiktok", "টিকটক", "TikTok"],
          ["instagram", "ইনস্টাগ্রাম", "Instagram"],
        ]),
      },
      {
        key: "niche",
        type: "text",
        label: { bn: "কোন ধরনের ইনফ্লুয়েন্সার", en: "Niche" },
        placeholder: { bn: "যেমন: ফুড রিভিউ, ফ্যাশন, টেক" },
        validation: { maxLength: 80 },
      },
      {
        key: "audienceArea",
        type: "radio",
        label: { bn: "কোন এলাকার দর্শক", en: "Audience area" },
        options: options([
          ["bogura", "বগুড়া", "Bogura"],
          ["north_bengal", "উত্তরবঙ্গ", "North Bengal"],
          ["bangladesh", "সারা বাংলাদেশ", "Bangladesh"],
        ]),
      },
      {
        key: "campaignBudget",
        type: "money",
        label: { bn: "ক্যাম্পেইন বাজেট (টাকা)", en: "Campaign budget" },
        required: true,
        validation: { min: 1000 },
      },
    ],
  },
);
