import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const graphics = digitalTemplate(
  { key: "graphics", name: "গ্রাফিক্স ডিজাইন", description: "Graphics design" },
  {
    key: "design",
    title: { bn: "ডিজাইনের তথ্য", en: "Design details" },
    fields: [
      {
        key: "designTypes",
        type: "checkboxes",
        label: { bn: "কী ডিজাইন লাগবে", en: "What do you need designed?" },
        required: true,
        summary: true,
        options: options([
          ["logo", "লোগো", "Logo"],
          ["banner", "ব্যানার / ফেস্টুন", "Banner / festoon"],
          ["social_posts", "সোশ্যাল মিডিয়া পোস্ট", "Social media posts"],
          ["packaging", "প্যাকেজিং", "Packaging"],
          ["print", "প্রিন্ট (কার্ড, লিফলেট)", "Print (cards, leaflets)"],
          ["brand_kit", "ব্র্যান্ড কিট", "Brand kit"],
        ]),
      },
      {
        key: "quantity",
        type: "number",
        label: { bn: "কয়টি ডিজাইন", en: "How many designs?" },
        validation: { min: 1, max: 500 },
      },
    ],
  },
);
