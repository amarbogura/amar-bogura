// Initial CMS content. Everything here is admin-editable (P12); the seed never overwrites it
// unless run with --overwrite.

export const siteSettings: Array<{ key: string; value: unknown }> = [
  // Phone numbers are intentionally null — a placeholder number could be dialled by a real user
  // in an emergency. The admin must set them before launch (P16 checklist); UI hides call buttons
  // while unset.
  { key: "hotline", value: { phone: null } },
  { key: "whatsapp", value: { phone: null } },
  { key: "ambulance_phone", value: { phone: null } },
  { key: "social_links", value: { facebook: null, youtube: null } },
  { key: "admin_notify_emails", value: { emails: [] } },
  // Floating mobile ambulance chip (docs/04 P3); calls ambulance_phone when set.
  { key: "emergency_chip", value: { enabled: true } },
];

const placeholder = (topic: string) => `> এই পেজের লেখা শীঘ্রই হালনাগাদ করা হবে।\n\n${topic}`;

export const pages: Array<{
  slug: string;
  titleBn: string;
  content: string;
  seoDescription: string;
}> = [
  {
    slug: "about",
    titleBn: "আমাদের সম্পর্কে",
    content: placeholder(
      "আমার বগুড়া হলো বগুড়ার মানুষের জন্য একটি স্থানীয় প্ল্যাটফর্ম — হোম সার্ভিস, গাড়ি ভাড়া, ডেলিভারি, বাজার, প্রপার্টি ও কেনাবেচা এক জায়গায়।",
    ),
    seoDescription: "আমার বগুড়া — বগুড়ার সব সার্ভিস এক জায়গায়।",
  },
  {
    slug: "contact",
    titleBn: "যোগাযোগ",
    content: placeholder("যেকোনো প্রশ্ন বা মতামতের জন্য নিচের ফর্মে লিখুন অথবা হটলাইনে কল করুন।"),
    seoDescription: "আমার বগুড়ার সাথে যোগাযোগ করুন।",
  },
  {
    slug: "help",
    titleBn: "সাহায্য ও প্রশ্নোত্তর",
    content: placeholder(
      "কীভাবে রিকোয়েস্ট করবেন, বিজ্ঞাপন দেবেন ও রিকোয়েস্ট ট্র্যাক করবেন — এখানে জানুন।",
    ),
    seoDescription: "আমার বগুড়া ব্যবহারের নিয়ম ও সাধারণ প্রশ্নোত্তর।",
  },
  {
    slug: "terms",
    titleBn: "ব্যবহারের শর্তাবলি",
    content: placeholder("আমার বগুড়া ব্যবহারের শর্তাবলি।"),
    seoDescription: "আমার বগুড়া ব্যবহারের শর্তাবলি।",
  },
  {
    slug: "privacy",
    titleBn: "গোপনীয়তা নীতি",
    content: placeholder("আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখা হয়।"),
    seoDescription: "আমার বগুড়ার গোপনীয়তা নীতি।",
  },
  {
    slug: "report",
    titleBn: "সমস্যা জানান",
    content: placeholder("কোনো বিজ্ঞাপন, রিকোয়েস্ট বা ব্যবহারকারী নিয়ে সমস্যা হলে আমাদের জানান।"),
    seoDescription: "আমার বগুড়ায় কোনো সমস্যা রিপোর্ট করুন।",
  },
];

// Config references catalog entities by slug (stable across environments), not by id.
export const homeSections: Array<{
  key: string;
  type: "QUICK_ACTIONS" | "SERVICES" | "CATEGORY_SPOTLIGHT" | "LISTINGS";
  titleBn: string;
  config: Record<string, unknown>;
}> = [
  {
    key: "quick_actions",
    type: "QUICK_ACTIONS",
    titleBn: "দ্রুত কাজ",
    config: { actions: ["custom-request", "ambulance", "buy-sell"] },
  },
  {
    key: "popular_services",
    type: "SERVICES",
    titleBn: "জনপ্রিয় সার্ভিস",
    config: {
      serviceSlugs: [
        "electrician",
        "ac-repair",
        "home-office-shifting",
        "rent-a-car",
        "plumber",
        "home-tutor",
      ],
    },
  },
  {
    key: "local_products",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "লোকাল পণ্য ও গ্রোসারি",
    config: { categorySlug: "local-products-grocery" },
  },
  {
    key: "protutors",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "ProTutors Bogura — হোম টিউটর",
    config: { categorySlug: "education" },
  },
  {
    key: "it_digital",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "আইটি ও ডিজিটাল সার্ভিস",
    config: { categorySlug: "it-digital" },
  },
  {
    key: "recent_listings",
    type: "LISTINGS",
    titleBn: "সাম্প্রতিক বিজ্ঞাপন",
    config: { limit: 8 },
  },
];
