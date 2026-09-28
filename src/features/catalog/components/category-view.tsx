import { Breadcrumbs } from "@/components/breadcrumbs";
import { Icon } from "@/components/icon";
import { SectionHeader } from "@/components/section-header";
import { ServiceCard } from "@/components/service-card";
import { env } from "@/env";
import { type Locale, localizePath } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { routes } from "@/lib/routes";

import { breadcrumbJsonLd, faqJsonLd } from "../jsonld";
import type { CatalogCategory } from "../types";
import { FaqList } from "./faq-list";
import { HowItWorks } from "./how-it-works";
import { JsonLd } from "./json-ld";
import { Markdown } from "./markdown";
import { RequestCta } from "./request-cta";

export function CategoryView({ category, locale }: { category: CatalogCategory; locale: Locale }) {
  const t = getT(locale);
  const path = routes.service(category.slug);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: t("common.home"), path: localizePath(locale, routes.home) },
              { name: category.name, path: localizePath(locale, path) },
            ],
            env.NEXT_PUBLIC_SITE_URL,
          ),
          faqJsonLd(category.faqs),
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:py-10">
        <Breadcrumbs
          items={[{ label: t("common.home"), href: routes.home }, { label: category.name }]}
        />

        <header className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
            <Icon name={category.iconKey} className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold md:text-3xl">{category.name}</h1>
            {category.shortDesc && <p className="text-muted-foreground">{category.shortDesc}</p>}
          </div>
        </header>

        <section aria-labelledby="services-title">
          <SectionHeader id="services-title" title={t("catalog.chooseService")} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => (
              <li key={service.slug}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </section>

        {category.introContent && (
          <section
            aria-label={t("common.aboutName", { name: category.name })}
            className="max-w-3xl"
          >
            <Markdown>{category.introContent}</Markdown>
          </section>
        )}

        <HowItWorks />
        <FaqList faqs={category.faqs} />

        <section className="flex flex-col gap-3 rounded-2xl bg-muted p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">{t("catalog.notListedTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("catalog.notListedText")}</p>
          </div>
          <RequestCta href={routes.customRequest} label={t("nav.customRequest")} note="" />
        </section>
      </div>
    </>
  );
}
