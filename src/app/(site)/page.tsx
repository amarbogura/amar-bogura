import { routes } from "@/lib/routes";

import { CategoryGrid } from "@/features/home/components/category-grid";
import { Hero } from "@/features/home/components/hero";
import { ProTutorsBlock } from "@/features/home/components/protutors-block";
import { QuickActions } from "@/features/home/components/quick-actions";
import { RecentListings } from "@/features/home/components/recent-listings";
import { ServicesSection } from "@/features/home/components/services-section";
import { getHomeCategories, getHomeSections } from "@/features/home/queries";

/** Homepage: fully prerendered from cached data (tags: home, catalog, listings). */
export default async function HomePage() {
  const [categories, sections] = await Promise.all([getHomeCategories(), getHomeSections()]);

  return (
    <>
      <Hero />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:gap-14 md:py-12">
        <CategoryGrid categories={categories} />
        {sections.map((section) => {
          switch (section.kind) {
            case "QUICK_ACTIONS":
              return (
                <QuickActions
                  key={section.key}
                  titleBn={section.titleBn}
                  actions={section.actions}
                />
              );
            case "SERVICES":
              return (
                <ServicesSection
                  key={section.key}
                  id={`section-${section.key}`}
                  titleBn={section.titleBn}
                  services={section.services}
                />
              );
            case "CATEGORY_SPOTLIGHT":
              return (
                <ServicesSection
                  key={section.key}
                  id={`section-${section.key}`}
                  titleBn={section.titleBn}
                  services={section.category.services.slice(0, 6)}
                  href={routes.service(section.category.slug)}
                />
              );
            case "PROTUTORS":
              return <ProTutorsBlock key={section.key} titleBn={section.titleBn} />;
            case "LISTINGS":
              return (
                <RecentListings key={section.key} titleBn={section.titleBn} limit={section.limit} />
              );
          }
        })}
      </div>
    </>
  );
}
