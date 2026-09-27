import type { CategorySeed } from "../types";

/** D-07: no sub-services; its page (/request/custom) is the custom_request form. */
export const customRequest: CategorySeed = {
  slug: "custom-request",
  kind: "CUSTOM_REQUEST",
  nameBn: "কাস্টম রিকোয়েস্ট",
  nameEn: "Custom Request",
  shortDescBn: "তালিকায় নেই? যা দরকার লিখে জানান",
  iconKey: "message-square-plus",
  keywords: ["কাস্টম রিকোয়েস্ট", "অন্য সার্ভিস", "custom request", "other service", "anything"],
  introContent:
    "যে সেবা খুঁজছেন তা তালিকায় নেই? যেকোনো বৈধ প্রয়োজন লিখে জানান — বগুড়ায় সমাধানের ব্যবস্থা করতে আমাদের টিম আপনার সাথে যোগাযোগ করবে। বারবার আসা অনুরোধ থেকেই আমরা নতুন সার্ভিস চালু করি।",
  faqs: [
    {
      q: "কী ধরনের রিকোয়েস্ট করা যায়?",
      a: "যেকোনো বৈধ কাজ — যেমন কাঠমিস্ত্রি, গ্যাসের চুলা মেরামত, পানির ট্যাংক পরিষ্কার ইত্যাদি।",
    },
    {
      q: "সব রিকোয়েস্ট কি পূরণ করা সম্ভব?",
      a: "চেষ্টা করা হয়; সম্ভব না হলে কারণসহ জানিয়ে দেওয়া হয়।",
    },
    {
      q: "রিকোয়েস্টের অবস্থা কীভাবে জানব?",
      a: "রিকোয়েস্ট কোড দিয়ে ট্র্যাক করতে পারবেন, অথবা একই নম্বরে লগইন করে দেখবেন।",
    },
  ],
  defaultTemplate: "custom_request",
};
