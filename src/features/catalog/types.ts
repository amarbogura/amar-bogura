import type { ServiceCardData } from "@/components/service-card";
import type { CategoryKind } from "@/generated/prisma/enums";

import type { Faq } from "./faqs";

/**
 * Catalog entries are resolved for ONE language by the query (`name`, `shortDesc`, `faqs`… are
 * already English or Bangla, with Bangla fallback). `nameBn`/`nameEn` stay for JSON-LD
 * `alternateName` and search synonyms.
 */
export interface CatalogCategory {
  id: string;
  slug: string;
  kind: CategoryKind;
  name: string;
  nameBn: string;
  nameEn: string;
  shortDesc: string | null;
  iconKey: string;
  introContent: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqs: Faq[];
  services: ServiceCardData[];
}

export interface CatalogService extends ServiceCardData {
  id: string;
  nameBn: string;
  nameEn: string;
  description: string | null;
  priceNote: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqs: Faq[];
  category: { slug: string; name: string; kind: CategoryKind };
}

export type CatalogEntry =
  { type: "category"; category: CatalogCategory } | { type: "service"; service: CatalogService };
