import type { CategorySeed, ServiceSeed } from "../types";

const rentalFaqs = (vehicleBn: string) => [
  {
    q: `${vehicleBn} ভাড়া কীভাবে ঠিক হয়?`,
    a: "দূরত্ব, সময় ও যাত্রার ধরন (একমুখী, যাওয়া-আসা, সারাদিন) অনুযায়ী আমাদের টিম ফোনে ভাড়া জানায়।",
  },
  {
    q: "বগুড়ার বাইরে যাওয়া যাবে?",
    a: "হ্যাঁ। গন্তব্যের নাম লিখে দিন — ঢাকা, রাজশাহী বা যেকোনো জেলায় যাওয়ার ব্যবস্থা করা হয়।",
  },
  {
    q: "কত আগে রিকোয়েস্ট করা ভালো?",
    a: "অন্তত কয়েক ঘণ্টা আগে; ঈদ বা বিয়ের মৌসুমে ১–২ দিন আগে রিকোয়েস্ট করলে গাড়ি নিশ্চিত পাওয়া সহজ।",
  },
];

const rental = (
  vehicleType: string,
  seed: Omit<ServiceSeed, "template" | "formPresets" | "faqs">,
  vehicleBn: string,
): ServiceSeed => ({
  ...seed,
  template: "vehicle_rent",
  formPresets: { pinned: { vehicleType } },
  faqs: rentalFaqs(vehicleBn),
});

export const rentAVehicle: CategorySeed = {
  slug: "rent-a-vehicle",
  kind: "SERVICE",
  nameBn: "গাড়ি ভাড়া",
  nameEn: "Rent a Vehicle",
  shortDescBn: "কার, সিএনজি, পিকআপ, ভ্যান ও ট্রাক ভাড়া",
  iconKey: "car",
  keywords: [
    "গাড়ি ভাড়া",
    "রেন্ট এ কার",
    "rent a car",
    "vehicle rent",
    "gari vara",
    "ভাড়া গাড়ি",
  ],
  introContent:
    "বগুড়া থেকে যেকোনো গন্তব্যে যাত্রী বা মালামাল নিতে গাড়ি ভাড়া করুন সহজে। প্রাইভেট কার, মাইক্রো, সিএনজি, পিকআপ, ভ্যান বা ট্রাক — কোথা থেকে কোথায় ও কখন লাগবে জানালেই আমাদের টিম উপযুক্ত গাড়ির ব্যবস্থা করবে।",
  faqs: [
    {
      q: "ড্রাইভার কি গাড়ির সাথে থাকে?",
      a: "হ্যাঁ, সব ভাড়ার গাড়ি ড্রাইভারসহ দেওয়া হয়।",
    },
    {
      q: "জ্বালানি ও টোল খরচ কে দেবে?",
      a: "সাধারণত ভাড়ার মধ্যে জ্বালানি ধরা থাকে; টোল, পার্কিং বা ফেরির খরচ আলাদা — ভাড়া নিশ্চিত করার সময় জানিয়ে দেওয়া হয়।",
    },
    {
      q: "অগ্রিম টাকা দিতে হয়?",
      a: "দূরের বা একাধিক দিনের যাত্রায় কিছু অগ্রিম লাগতে পারে; ফোনে বিস্তারিত জানানো হবে।",
    },
  ],
  services: [
    rental(
      "car",
      {
        slug: "rent-a-car",
        nameBn: "প্রাইভেট কার / মাইক্রো ভাড়া",
        nameEn: "Rent a Car",
        shortDescBn: "এসি কার ও মাইক্রোবাস — বিয়ে, ভ্রমণ ও অফিসের কাজে",
        iconKey: "car",
        keywords: [
          "কার ভাড়া",
          "মাইক্রো ভাড়া",
          "প্রাইভেট কার",
          "rent a car",
          "microbus",
          "car rental",
          "noah",
        ],
        description:
          "বিয়ে, পারিবারিক ভ্রমণ, হাসপাতাল বা অফিসের কাজে বগুড়া থেকে প্রাইভেট কার ও মাইক্রোবাস ভাড়া নিন। এসি-নন এসি, সেডান বা ৭–১১ সিটের মাইক্রো — প্রয়োজন জানালেই ব্যবস্থা।",
        isFeatured: true,
        related: ["rent-a-cng", "wedding-photography"],
      },
      "কার",
    ),
    rental(
      "cng",
      {
        slug: "rent-a-cng",
        nameBn: "সিএনজি ভাড়া",
        nameEn: "Rent a CNG",
        shortDescBn: "শহর ও আশেপাশে যাতায়াতের জন্য সিএনজি রিজার্ভ",
        iconKey: "car-taxi-front",
        keywords: ["সিএনজি ভাড়া", "সিএনজি রিজার্ভ", "cng", "cng rent", "auto rickshaw"],
        description:
          "বগুড়া শহর বা কাছের উপজেলায় যাতায়াতে সিএনজি রিজার্ভ করুন — ঘণ্টা হিসেবে বা একমুখী যাত্রায়।",
        related: ["rent-a-car"],
      },
      "সিএনজি",
    ),
    rental(
      "pickup",
      {
        slug: "rent-a-pickup",
        nameBn: "পিকআপ ভাড়া",
        nameEn: "Rent a Pickup",
        shortDescBn: "ছোট মালামাল ও বাসা বদলের জন্য পিকআপ",
        iconKey: "truck",
        keywords: ["পিকআপ ভাড়া", "পিকআপ", "pickup", "pickup rent", "pick up van"],
        description:
          "ফার্নিচার, দোকানের মাল বা ছোট বাসা বদলের জন্য বগুড়ায় পিকআপ ভাড়া নিন। প্রয়োজনে শ্রমিকসহ পাঠানো হয়।",
        related: ["rent-a-truck", "home-office-shifting"],
      },
      "পিকআপ",
    ),
    rental(
      "van",
      {
        slug: "rent-a-van",
        nameBn: "ভ্যান ভাড়া",
        nameEn: "Rent a Van",
        shortDescBn: "স্বল্প দূরত্বে মালামাল ও যাত্রী পরিবহন",
        iconKey: "bus",
        keywords: ["ভ্যান ভাড়া", "ভ্যান", "van", "van rent"],
        description:
          "শহরের ভেতরে অল্প দূরত্বে মালামাল বা যাত্রী নিতে ভ্যান ভাড়া করুন সাশ্রয়ী খরচে।",
        related: ["rent-a-pickup"],
      },
      "ভ্যান",
    ),
    rental(
      "truck",
      {
        slug: "rent-a-truck",
        nameBn: "ট্রাক ভাড়া",
        nameEn: "Rent a Truck",
        shortDescBn: "১ থেকে ৭.৫ টন ট্রাক ও কাভার্ড ভ্যান",
        iconKey: "truck",
        keywords: ["ট্রাক ভাড়া", "ট্রাক", "কাভার্ড ভ্যান", "truck", "truck rent", "covered van"],
        description:
          "ধান-চাল, নির্মাণসামগ্রী, কারখানার মাল বা পুরো বাসার মালামাল — বগুড়া থেকে দেশের যেকোনো জায়গায় ট্রাক ও কাভার্ড ভ্যান ভাড়া নিন।",
        related: ["rent-a-pickup", "home-office-shifting"],
      },
      "ট্রাক",
    ),
  ],
};
