import { Breadcrumbs } from "@/components/breadcrumbs";
import { Icon } from "@/components/icon";
import { SectionHeader } from "@/components/section-header";
import { ServiceCard } from "@/components/service-card";
import { env } from "@/env";
import { routes } from "@/lib/routes";

import { breadcrumbJsonLd, faqJsonLd } from "../jsonld";
import type { CatalogCategory } from "../types";
import { FaqList } from "./faq-list";
import { HowItWorks } from "./how-it-works";
import { JsonLd } from "./json-ld";
import { Markdown } from "./markdown";
import { RequestCta } from "./request-cta";

export function CategoryView({ category }: { category: CatalogCategory }) {
  const path = routes.service(category.slug);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "হোম", path: routes.home },
              { name: category.nameBn, path },
            ],
            env.NEXT_PUBLIC_SITE_URL,
          ),
          faqJsonLd(category.faqs),
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:py-10">
        <Breadcrumbs items={[{ label: "হোম", href: routes.home }, { label: category.nameBn }]} />

        <header className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
            <Icon name={category.iconKey} className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold md:text-3xl">{category.nameBn}</h1>
            {category.shortDescBn && (
              <p className="text-muted-foreground">{category.shortDescBn}</p>
            )}
          </div>
        </header>

        <section aria-labelledby="services-title">
          <SectionHeader id="services-title" title="সার্ভিস বেছে নিন" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => (
              <li key={service.slug}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </section>

        {category.introContent && (
          <section aria-label={`${category.nameBn} সম্পর্কে`} className="max-w-3xl">
            <Markdown>{category.introContent}</Markdown>
          </section>
        )}

        <HowItWorks />
        <FaqList faqs={category.faqs} />

        <section className="flex flex-col gap-3 rounded-2xl bg-muted p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">যা খুঁজছেন তা তালিকায় নেই?</h2>
            <p className="text-sm text-muted-foreground">
              যেকোনো বৈধ কাজ লিখে জানান — আমরা ব্যবস্থা করার চেষ্টা করব।
            </p>
          </div>
          <RequestCta href={routes.customRequest} label="কাস্টম রিকোয়েস্ট" note="" />
        </section>
      </div>
    </>
  );
}
