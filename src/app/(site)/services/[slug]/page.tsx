import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CategoryView } from "@/features/catalog/components/category-view";
import { ServiceView } from "@/features/catalog/components/service-view";
import { catalogMetadata } from "@/features/catalog/metadata";
import { getCatalogStaticParams, resolveCatalogSlug } from "@/features/catalog/queries";
import { categoryHref, DEDICATED_SERVICE_PAGES } from "@/lib/routes";

/** Every active SERVICE category + service is prerendered; admin-added slugs render on demand. */
export async function generateStaticParams() {
  const params = await getCatalogStaticParams();
  return params.filter(({ slug }) => !(slug in DEDICATED_SERVICE_PAGES));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const entry = await resolveCatalogSlug((await params).slug);
  return entry ? catalogMetadata(entry) : {};
}

/** D-14: one namespace for categories and services (slugs are unique across both). */
export default async function CatalogPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const entry = await resolveCatalogSlug(slug);
  if (!entry) notFound();

  if (entry.type === "category") {
    // Only SERVICE categories live here; the others have their own sections.
    if (entry.category.kind !== "SERVICE")
      permanentRedirect(categoryHref(entry.category.kind, slug));
    return <CategoryView category={entry.category} />;
  }

  const dedicated = DEDICATED_SERVICE_PAGES[slug];
  if (dedicated) permanentRedirect(dedicated);
  return <ServiceView service={entry.service} />;
}
