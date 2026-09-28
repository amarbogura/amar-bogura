import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryView } from "@/features/catalog/components/category-view";
import { ServiceView } from "@/features/catalog/components/service-view";
import { catalogMetadata } from "@/features/catalog/metadata";
import { getCatalogStaticParams, resolveCatalogSlug } from "@/features/catalog/queries";
import { permanentRedirectTo } from "@/i18n/redirect";
import { resolveLocale } from "@/i18n/server";
import { categoryHref, DEDICATED_SERVICE_PAGES } from "@/lib/routes";

/** Every active SERVICE category + service is prerendered; admin-added slugs render on demand. */
export async function generateStaticParams() {
  const params = await getCatalogStaticParams();
  return params.filter(({ slug }) => !(slug in DEDICATED_SERVICE_PAGES));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  const entry = await resolveCatalogSlug(slug, locale);
  return entry ? catalogMetadata(entry, locale) : {};
}

/** D-14: one namespace for categories and services (slugs are unique across both). */
export default async function CatalogPage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  const entry = await resolveCatalogSlug(slug, locale);
  if (!entry) notFound();

  if (entry.type === "category") {
    // Only SERVICE categories live here; the others have their own sections.
    if (entry.category.kind !== "SERVICE")
      permanentRedirectTo(locale, categoryHref(entry.category.kind, slug));
    return <CategoryView category={entry.category} locale={locale} />;
  }

  const dedicated = DEDICATED_SERVICE_PAGES[slug];
  if (dedicated) permanentRedirectTo(locale, dedicated);
  return <ServiceView service={entry.service} locale={locale} />;
}
