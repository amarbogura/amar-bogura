import type { CategorySeed } from "../types";

export const property: CategorySeed = {
  slug: "property",
  kind: "PROPERTY",
  nameBn: "প্রপার্টি",
  nameEn: "Property",
  shortDescBn: "বাসা-ফ্ল্যাট ভাড়া, দোকান-অফিস ভাড়া, জমি ও বাড়ি বিক্রয়",
  iconKey: "building-2",
  keywords: [
    "বাসা ভাড়া",
    "ফ্ল্যাট",
    "জমি বিক্রি",
    "to-let",
    "to let",
    "property",
    "house rent",
    "basa vara",
  ],
  introContent:
    "বগুড়ায় বাসা বা ফ্ল্যাট ভাড়া খুঁজছেন, দোকান-অফিস ভাড়া দিতে চান, কিংবা জমি বা বাড়ি বিক্রি করবেন? এলাকা, ভাড়া বা দাম, রুম সংখ্যা দিয়ে খুঁজুন অথবা নিজের প্রপার্টির বিজ্ঞাপন দিন — প্রতিটি বিজ্ঞাপন যাচাই করে প্রকাশ করা হয়।",
  faqs: [
    {
      q: "প্রপার্টির বিজ্ঞাপন দিতে কী লাগে?",
      a: "লগইন করে মোবাইল নম্বর যাচাই করুন, তারপর ছবি ও বিস্তারিত দিয়ে বিজ্ঞাপন জমা দিন।",
    },
    {
      q: "দালাল ছাড়া সরাসরি মালিকের সাথে কথা বলা যায়?",
      a: "বিজ্ঞাপনে দেওয়া নম্বরে সরাসরি যোগাযোগ করা যায়; লগইন করলে নম্বর দেখা যাবে।",
    },
    {
      q: "জমি কেনার আগে কী যাচাই করব?",
      a: "দলিল, খতিয়ান, নামজারি ও হালনাগাদ খাজনার কাগজ দেখে নিন এবং প্রয়োজনে আইনজীবীর পরামর্শ নিন।",
    },
  ],
  listingCategories: [
    {
      slug: "house-flat-rent",
      nameBn: "বাসা / ফ্ল্যাট ভাড়া",
      nameEn: "House / Flat Rent",
      iconKey: "house",
      template: "listing_property_rent",
      propertyPurpose: "RENT",
      propertyTypes: ["FLAT", "HOUSE", "ROOM"],
      introContent:
        "বগুড়া শহরে পরিবার বা ব্যাচেলরদের জন্য বাসা, ফ্ল্যাট ও রুম ভাড়া — সাতমাথা, মালতীনগর, জলেশ্বরীতলা, শেরপুর রোডসহ সব এলাকায়।",
    },
    {
      slug: "office-shop-rent",
      nameBn: "অফিস / দোকান ভাড়া",
      nameEn: "Office / Shop Rent",
      iconKey: "store",
      template: "listing_property_rent",
      propertyPurpose: "RENT",
      propertyTypes: ["OFFICE", "SHOP", "COMMERCIAL"],
      introContent: "বগুড়ায় অফিস স্পেস, দোকান ও বাণিজ্যিক জায়গা ভাড়া।",
    },
    {
      slug: "land-sale",
      nameBn: "জমি বিক্রয়",
      nameEn: "Land Sale",
      iconKey: "land-plot",
      template: "listing_property_sale",
      propertyPurpose: "SALE",
      propertyTypes: ["LAND"],
      introContent:
        "বগুড়া জেলায় আবাসিক, বাণিজ্যিক ও কৃষি জমি বিক্রয় — শতাংশ, কাঠা বা বিঘা হিসেবে।",
    },
    {
      slug: "house-sale",
      nameBn: "বাড়ি / ফ্ল্যাট বিক্রয়",
      nameEn: "House / Flat Sale",
      iconKey: "building",
      template: "listing_property_sale",
      propertyPurpose: "SALE",
      propertyTypes: ["HOUSE", "FLAT"],
      introContent: "বগুড়ায় তৈরি বাড়ি ও ফ্ল্যাট বিক্রয়।",
    },
    {
      slug: "other-property-sale",
      nameBn: "অন্যান্য প্রপার্টি বিক্রয়",
      nameEn: "Other Property Sale",
      iconKey: "warehouse",
      template: "listing_property_sale",
      propertyPurpose: "SALE",
      propertyTypes: ["COMMERCIAL", "OTHER"],
      introContent: "দোকান, মার্কেট, গোডাউন ও অন্যান্য বাণিজ্যিক প্রপার্টি বিক্রয়।",
    },
  ],
};
