import type { CategorySeed } from "../types";

// The "Property" tile on Buy & Sell is a UI deep link to /property?purpose=sale (D-06),
// not a ListingCategory — property listings live under the Property category.
export const buySell: CategorySeed = {
  slug: "buy-sell",
  kind: "MARKETPLACE",
  nameBn: "বাই অ্যান্ড সেল",
  nameEn: "Buy & Sell",
  shortDescBn: "মোবাইল, ফার্নিচার, ইলেকট্রনিক্স, বাইক ও গাড়ি কেনাবেচা",
  iconKey: "shopping-bag",
  keywords: ["কেনাবেচা", "বিক্রি", "পুরাতন জিনিস", "buy sell", "second hand", "used", "bikroy"],
  introContent:
    "বগুড়ায় নতুন-পুরাতন জিনিস কেনাবেচা করুন নিজের এলাকার মানুষের সাথে। মোবাইল, ল্যাপটপ, ফার্নিচার, ইলেকট্রনিক্স, মোটরসাইকেল ও গাড়ির বিজ্ঞাপন দিন — প্রতিটি বিজ্ঞাপন যাচাই করে প্রকাশ করা হয়।",
  faqs: [
    {
      q: "বিজ্ঞাপন দিতে কি টাকা লাগে?",
      a: "না, বর্তমানে বিজ্ঞাপন দেওয়া সম্পূর্ণ ফ্রি। শুধু লগইন করে মোবাইল নম্বর যাচাই করতে হয়।",
    },
    {
      q: "বিজ্ঞাপন কত দিন থাকে?",
      a: "অনুমোদনের পর ৬০ দিন। এরপর চাইলে আবার চালু করতে পারবেন।",
    },
    {
      q: "প্রতারণা এড়াতে কী করব?",
      a: "সামনাসামনি দেখে পণ্য কিনুন, অগ্রিম টাকা পাঠাবেন না। সন্দেহজনক বিজ্ঞাপন 'রিপোর্ট' বাটনে জানান।",
    },
  ],
  listingCategories: [
    {
      slug: "mobile-laptop",
      nameBn: "মোবাইল ও কম্পিউটার",
      nameEn: "Mobile & Laptop",
      iconKey: "smartphone",
      template: "listing_mobile_computer",
      introContent:
        "বগুড়ায় নতুন ও ব্যবহৃত মোবাইল, ল্যাপটপ, ডেস্কটপ, ট্যাবলেট ও এক্সেসরিজ কেনাবেচা।",
    },
    {
      slug: "furniture",
      nameBn: "ফার্নিচার",
      nameEn: "Furniture",
      iconKey: "sofa",
      template: "listing_furniture",
      introContent: "খাট, সোফা, আলমারি, টেবিল-চেয়ারসহ বাসা ও অফিসের ফার্নিচার কেনাবেচা।",
    },
    {
      slug: "electronics",
      nameBn: "ইলেকট্রনিক্স",
      nameEn: "Electronics",
      iconKey: "tv",
      template: "listing_electronics",
      introContent: "টিভি, ফ্রিজ, এসি, ওয়াশিং মেশিন, আইপিএস ও অন্যান্য ইলেকট্রনিক্স কেনাবেচা।",
    },
    {
      slug: "bike",
      nameBn: "মোটরসাইকেল",
      nameEn: "Motorcycle",
      iconKey: "bike",
      template: "listing_bike",
      introContent: "বগুড়ায় নতুন ও পুরাতন মোটরসাইকেল কেনাবেচা — কাগজপত্রের তথ্যসহ।",
    },
    {
      slug: "car",
      nameBn: "গাড়ি",
      nameEn: "Car",
      iconKey: "car-front",
      template: "listing_car",
      introContent: "প্রাইভেট কার, মাইক্রো ও অন্যান্য গাড়ি কেনাবেচা।",
    },
    {
      slug: "others",
      nameBn: "অন্যান্য",
      nameEn: "Others",
      iconKey: "package-open",
      template: "listing_other",
      introContent: "অন্য যেকোনো বৈধ পণ্যের কেনাবেচা।",
    },
  ],
};
