import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const webDev = digitalTemplate(
  { key: "web_dev", name: "ওয়েবসাইট তৈরি", description: "Website development" },
  {
    key: "website",
    title: { bn: "ওয়েবসাইটের তথ্য", en: "Website details" },
    fields: [
      {
        key: "siteType",
        type: "select",
        label: { bn: "ওয়েবসাইটের ধরন", en: "Type of website" },
        required: true,
        summary: true,
        options: options([
          ["business", "ব্যবসার ওয়েবসাইট", "Business website"],
          ["ecommerce", "ই-কমার্স", "E-commerce"],
          ["portfolio", "পোর্টফোলিও", "Portfolio"],
          ["booking", "বুকিং / অ্যাপয়েন্টমেন্ট", "Booking / appointments"],
          ["news", "নিউজ পোর্টাল", "News portal"],
          ["custom", "কাস্টম", "Custom"],
        ]),
      },
      {
        key: "pages",
        type: "number",
        label: { bn: "আনুমানিক পেজ সংখ্যা", en: "Approximate number of pages" },
        validation: { min: 1, max: 500 },
      },
      {
        key: "features",
        type: "checkboxes",
        label: { bn: "যা যা লাগবে", en: "Features needed" },
        options: options([
          ["payment", "অনলাইন পেমেন্ট", "Online payment"],
          ["login", "ইউজার লগইন", "User login"],
          ["blog", "ব্লগ", "Blog"],
          ["bilingual", "বাংলা-ইংরেজি দুই ভাষা", "Bangla and English"],
        ]),
      },
      {
        key: "hasDomain",
        type: "boolean",
        label: { bn: "ডোমেইন ও হোস্টিং আগে থেকে আছে", en: "I already have a domain and hosting" },
      },
    ],
  },
);
