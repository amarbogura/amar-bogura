import { Breadcrumbs } from "@/components/breadcrumbs";
import { Icon } from "@/components/icon";
import { PriceTag } from "@/components/price-tag";
import { SectionHeader } from "@/components/section-header";
import { ServiceCard } from "@/components/service-card";
import { env } from "@/env";
import { type Locale, localizePath } from "@/i18n/config";
import { getT } from "@/i18n/server";
import { routes } from "@/lib/routes";

import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "../jsonld";
import { getRelatedServices } from "../queries";
import type { CatalogService } from "../types";
import { FaqList } from "./faq-list";
import { HowItWorks } from "./how-it-works";
import { JsonLd } from "./json-ld";
import { Markdown } from "./markdown";
import { RequestCta } from "./request-cta";

export async function ServiceView({
  service,
  locale,
}: {
  service: CatalogService;
  locale: Locale;
}) {
  const t = getT(locale);
  const path = routes.service(service.slug);
  const categoryPath = routes.service(service.category.slug);
  const related = await getRelatedServices(service.id, service.category.slug, locale);
  const requestHref = routes.serviceRequest(service.slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: t("common.home"), path: localizePath(locale, routes.home) },
              { name: service.category.name, path: localizePath(locale, categoryPath) },
              { name: service.name, path: localizePath(locale, path) },
            ],
            env.NEXT_PUBLIC_SITE_URL,
          ),
          serviceJsonLd(service, localizePath(locale, path), env.NEXT_PUBLIC_SITE_URL, {
            locale,
            siteName: t("common.siteName"),
            startingPriceLabel: t("price.startingPrice"),
          }),
          faqJsonLd(service.faqs),
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:py-10">
        <Breadcrumbs
          items={[
            { label: t("common.home"), href: routes.home },
            { label: service.category.name, href: categoryPath },
            { label: service.name },
          ]}
        />

        <header className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-xs md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
              <Icon name={service.iconKey} className="size-7" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold md:text-3xl">{service.name}</h1>
              {service.shortDesc && <p className="text-muted-foreground">{service.shortDesc}</p>}
              {service.startingPrice != null ? (
                <PriceTag amount={service.startingPrice} from />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {service.priceNote ?? t("price.onCall")}
                </p>
              )}
            </div>
          </div>
          <RequestCta href={requestHref} />
        </header>

        {service.description && (
          <section aria-label={t("common.aboutName", { name: service.name })} className="max-w-3xl">
            <Markdown>{service.description}</Markdown>
          </section>
        )}

        <HowItWorks />
        <FaqList faqs={service.faqs} />

        <div className="flex justify-center">
          <RequestCta
            href={requestHref}
            label={t("catalog.requestNamed", { name: service.name })}
          />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-title">
            <SectionHeader id="related-title" title={t("catalog.related")} href={categoryPath} />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.slug}>
                  <ServiceCard service={item} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
