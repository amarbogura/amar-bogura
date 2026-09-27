import type { ServiceFormPresets } from "@/features/forms/types";
import type {
  AreaType,
  CategoryKind,
  PropertyPurpose,
  PropertyType,
} from "@/generated/prisma/enums";

export type Faq = { q: string; a: string };

export interface AreaSeed {
  slug: string;
  nameBn: string;
  nameEn: string;
  type: AreaType;
  parentSlug?: string;
}

export interface ServiceSeed {
  slug: string;
  nameBn: string;
  nameEn: string;
  shortDescBn: string;
  iconKey: string;
  keywords: string[];
  /** Markdown intro (Service.description), Bangla, mentions Bogura. */
  description: string;
  faqs: Faq[];
  template: string;
  formPresets?: ServiceFormPresets;
  priceNote?: string;
  isFeatured?: boolean;
  isEmergency?: boolean;
  allowGuest?: boolean;
  related?: string[];
}

export interface ListingCategorySeed {
  slug: string;
  nameBn: string;
  nameEn: string;
  iconKey: string;
  template: string;
  propertyPurpose?: PropertyPurpose;
  propertyTypes?: PropertyType[];
  introContent?: string;
  faqs?: Faq[];
}

export interface CategorySeed {
  slug: string;
  kind: CategoryKind;
  nameBn: string;
  nameEn: string;
  shortDescBn: string;
  iconKey: string;
  keywords: string[];
  introContent: string;
  faqs: Faq[];
  defaultTemplate?: string;
  showOnHome?: boolean;
  services?: ServiceSeed[];
  listingCategories?: ListingCategorySeed[];
}
