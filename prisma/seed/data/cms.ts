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
const placeholderEn = (topic: string) => `> This page will be updated soon.\n\n${topic}`;

export const pages: Array<{
  slug: string;
  titleBn: string;
  titleEn: string;
  content: string;
  contentEn: string;
  seoDescription: string;
  seoDescriptionEn: string;
}> = [
  {
    slug: "about",
    titleBn: "আমাদের সম্পর্কে",
    content: placeholder(
      "আমার বগুড়া হলো বগুড়ার মানুষের জন্য একটি স্থানীয় প্ল্যাটফর্ম — হোম সার্ভিস, গাড়ি ভাড়া, ডেলিভারি, বাজার, প্রপার্টি ও কেনাবেচা এক জায়গায়।",
    ),
    seoDescription: "আমার বগুড়া — বগুড়ার সব সার্ভিস এক জায়গায়।",
    titleEn: "About us",
    contentEn: placeholderEn(
      "Amar Bogura is a local platform for the people of Bogura — home services, vehicle rental, delivery, groceries, property and buying & selling in one place.",
    ),
    seoDescriptionEn: "Amar Bogura — every service in Bogura, in one place.",
  },
  {
    slug: "contact",
    titleBn: "যোগাযোগ",
    content: placeholder("যেকোনো প্রশ্ন বা মতামতের জন্য নিচের ফর্মে লিখুন অথবা হটলাইনে কল করুন।"),
    seoDescription: "আমার বগুড়ার সাথে যোগাযোগ করুন।",
    titleEn: "Contact",
    contentEn: placeholderEn(
      "For any question or feedback, write to us using the form below or call the hotline.",
    ),
    seoDescriptionEn: "Get in touch with Amar Bogura.",
  },
  {
    slug: "help",
    titleBn: "সাহায্য ও প্রশ্নোত্তর",
    content: placeholder(
      "কীভাবে রিকোয়েস্ট করবেন, বিজ্ঞাপন দেবেন ও রিকোয়েস্ট ট্র্যাক করবেন — এখানে জানুন।",
    ),
    seoDescription: "আমার বগুড়া ব্যবহারের নিয়ম ও সাধারণ প্রশ্নোত্তর।",
    titleEn: "Help & FAQ",
    contentEn: placeholderEn("Learn how to send a request, post an ad and track your requests."),
    seoDescriptionEn: "How to use Amar Bogura, and common questions.",
  },
  {
    slug: "terms",
    titleBn: "ব্যবহারের শর্তাবলি",
    content: placeholder("আমার বগুড়া ব্যবহারের শর্তাবলি।"),
    seoDescription: "আমার বগুড়া ব্যবহারের শর্তাবলি।",
    titleEn: "Terms of use",
    contentEn: placeholderEn("Terms of use for Amar Bogura."),
    seoDescriptionEn: "Terms of use for Amar Bogura.",
  },
  {
    slug: "privacy",
    titleBn: "গোপনীয়তা নীতি",
    content: placeholder("আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখা হয়।"),
    seoDescription: "আমার বগুড়ার গোপনীয়তা নীতি।",
    titleEn: "Privacy policy",
    contentEn: placeholderEn("How your information is collected, used and kept safe."),
    seoDescriptionEn: "Amar Bogura's privacy policy.",
  },
  {
    slug: "report",
    titleBn: "সমস্যা জানান",
    content: placeholder("কোনো বিজ্ঞাপন, রিকোয়েস্ট বা ব্যবহারকারী নিয়ে সমস্যা হলে আমাদের জানান।"),
    seoDescription: "আমার বগুড়ায় কোনো সমস্যা রিপোর্ট করুন।",
    titleEn: "Report a problem",
    contentEn: placeholderEn("Tell us about a problem with an ad, a request or a user."),
    seoDescriptionEn: "Report a problem on Amar Bogura.",
  },
];

// Config references catalog entities by slug (stable across environments), not by id.
export const homeSections: Array<{
  key: string;
  type: "QUICK_ACTIONS" | "SERVICES" | "CATEGORY_SPOTLIGHT" | "LISTINGS";
  titleBn: string;
  titleEn: string;
  config: Record<string, unknown>;
}> = [
  {
    key: "quick_actions",
    type: "QUICK_ACTIONS",
    titleBn: "দ্রুত কাজ",
    titleEn: "Quick actions",
    config: { actions: ["custom-request", "ambulance", "buy-sell"] },
  },
  {
    key: "popular_services",
    type: "SERVICES",
    titleBn: "জনপ্রিয় সার্ভিস",
    titleEn: "Popular services",
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
    titleEn: "Local products & grocery",
    config: { categorySlug: "local-products-grocery" },
  },
  {
    key: "protutors",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "ProTutors Bogura — হোম টিউটর",
    titleEn: "ProTutors Bogura — home tutors",
    config: { categorySlug: "education" },
  },
  {
    key: "it_digital",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "আইটি ও ডিজিটাল সার্ভিস",
    titleEn: "IT & digital services",
    config: { categorySlug: "it-digital" },
  },
  {
    key: "recent_listings",
    type: "LISTINGS",
    titleBn: "সাম্প্রতিক বিজ্ঞাপন",
    titleEn: "Latest ads",
    config: { limit: 8 },
  },
];
