import type { AreaSeed } from "./types";

// Coverage (D-08): whole Bogura district → 12 upazilas → key Sadar areas. Admin-editable later.
const upazilas: Array<[slug: string, nameBn: string, nameEn: string]> = [
  ["bogura-sadar", "বগুড়া সদর", "Bogura Sadar"],
  ["shajahanpur", "শাজাহানপুর", "Shajahanpur"],
  ["sherpur", "শেরপুর", "Sherpur"],
  ["shibganj", "শিবগঞ্জ", "Shibganj"],
  ["gabtali", "গাবতলী", "Gabtali"],
  ["kahaloo", "কাহালু", "Kahaloo"],
  ["dhunat", "ধুনট", "Dhunat"],
  ["dhupchanchia", "দুপচাঁচিয়া", "Dhupchanchia"],
  ["adamdighi", "আদমদীঘি", "Adamdighi"],
  ["nandigram", "নন্দীগ্রাম", "Nandigram"],
  ["sariakandi", "সারিয়াকান্দি", "Sariakandi"],
  ["sonatala", "সোনাতলা", "Sonatala"],
];

const sadarAreas: Array<[slug: string, nameBn: string, nameEn: string]> = [
  ["satmatha", "সাতমাথা", "Satmatha"],
  ["jaleshwaritola", "জলেশ্বরীতলা", "Jaleshwaritola"],
  ["malotinagar", "মালতীনগর", "Malotinagar"],
  ["sutrapur", "সূত্রাপুর", "Sutrapur"],
  ["namazgarh", "নামাজগড়", "Namazgarh"],
  ["kalitola", "কালীতলা", "Kalitola"],
  ["thanthania", "ঠনঠনিয়া", "Thanthania"],
  ["sherpur-road", "শেরপুর রোড", "Sherpur Road"],
  ["banani", "বনানী", "Banani"],
  ["chelopara", "চেলোপাড়া", "Chelopara"],
  ["fulbari", "ফুলবাড়ী", "Fulbari"],
  ["nishindara", "নিশিন্দারা", "Nishindara"],
  ["rahman-nagar", "রহমাননগর", "Rahman Nagar"],
  ["khandar", "খান্দার", "Khandar"],
  ["baragola", "বড়গোলা", "Baragola"],
];

/** Parents always come before children (seed inserts in this order). */
export const areas: AreaSeed[] = [
  { slug: "bogura", nameBn: "বগুড়া", nameEn: "Bogura", type: "DISTRICT" },
  ...upazilas.map(([slug, nameBn, nameEn]) => ({
    slug,
    nameBn,
    nameEn,
    type: "UPAZILA" as const,
    parentSlug: "bogura",
  })),
  ...sadarAreas.map(([slug, nameBn, nameEn]) => ({
    slug,
    nameBn,
    nameEn,
    type: "AREA" as const,
    parentSlug: "bogura-sadar",
  })),
];
