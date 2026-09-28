"use client";

import { CategoryCard, type CategoryCardData } from "@/components/category-card";
import { SectionHeader } from "@/components/section-header";
import { useT } from "@/i18n/client";

/** The 12 parent categories: 3 columns on mobile, 6 on desktop (never sub-services here). */
export function CategoryGrid({ categories }: { categories: CategoryCardData[] }) {
  const t = useT();
  return (
    <section id="services" aria-labelledby="categories-title" className="scroll-mt-20">
      <SectionHeader id="categories-title" title={t("home.allServices")} />
      <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {categories.map((category) => (
          <li key={category.slug}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>
    </section>
  );
}
