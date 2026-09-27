import type { ServiceCardData } from "@/components/service-card";
import type { CategoryKind } from "@/generated/prisma/enums";

import type { Faq } from "./faqs";

export interface CatalogCategory {
  id: string;
  slug: string;
  kind: CategoryKind;
  nameBn: string;
  nameEn: string;
  shortDescBn: string | null;
  iconKey: string;
  introContent: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqs: Faq[];
  services: ServiceCardData[];
}

export interface CatalogService extends ServiceCardData {
  id: string;
  nameEn: string;
  description: string | null;
  priceNote: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqs: Faq[];
  category: { slug: string; nameBn: string; kind: CategoryKind };
}

export type CatalogEntry =
  { type: "category"; category: CatalogCategory } | { type: "service"; service: CatalogService };
