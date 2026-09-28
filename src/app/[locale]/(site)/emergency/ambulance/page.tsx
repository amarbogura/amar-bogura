import { ClipboardPen } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { env } from "@/env";
import { EmergencyCall } from "@/features/catalog/components/emergency-call";
import { FaqList } from "@/features/catalog/components/faq-list";
import { JsonLd } from "@/features/catalog/components/json-ld";
import { Markdown } from "@/features/catalog/components/markdown";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/features/catalog/jsonld";
import { resolveCatalogSlug } from "@/features/catalog/queries";
import { tr } from "@/features/forms/schema-utils";
import { getTemplate } from "@/features/forms/templates";
import { getSiteSettings } from "@/features/site/queries";
import { type Locale, localizePath } from "@/i18n/config";
import { localeAlternates, ogLocale } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";

const PATH = routes.ambulance;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/emergency/ambulance">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  return {
    title: t("emergency.metaTitle"),
    description: t("emergency.metaDescription"),
    alternates: localeAlternates(locale, PATH),
    openGraph: {
      type: "website",
      siteName: t("common.siteName"),
      url: localizePath(locale, PATH),
      ...ogLocale(locale),
    },
  };
}

/** The ambulance "types" shown on the page come from the ambulance form template (one source). */
function ambulanceTypes(locale: Locale): string[] {
  const field = getTemplate("ambulance")
    ?.schema.sections.flatMap((section) => section.fields)
    .find((f) => f.key === "ambulanceType");
  return field?.options?.map((option) => tr(option.label, locale)) ?? [];
}

export default async function AmbulancePage({
  params,
}: PageProps<"/[locale]/emergency/ambulance">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const [settings, entry] = await Promise.all([
    getSiteSettings(),
    resolveCatalogSlug("ambulance", locale),
  ]);
  if (entry?.type !== "service") notFound();
  const { service } = entry;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: t("common.home"), path: localizePath(locale, routes.home) },
              { name: t("emergency.title"), path: localizePath(locale, PATH) },
            ],
            env.NEXT_PUBLIC_SITE_URL,
          ),
          serviceJsonLd(service, localizePath(locale, PATH), env.NEXT_PUBLIC_SITE_URL, {
            locale,
            siteName: t("common.siteName"),
            startingPriceLabel: t("price.startingPrice"),
          }),
          faqJsonLd(service.faqs),
        ]}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 md:py-8">
        {/* Call-now comes first so it is above the fold on a 360px phone. */}
        <EmergencyCall ambulancePhone={settings.ambulancePhone} />

        <Link
          href={routes.serviceRequest("ambulance")}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cta-tint text-emergency">
            <ClipboardPen className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">{t("emergency.cantCall")}</span>
            <span className="text-sm text-muted-foreground">{t("emergency.cantCallNote")}</span>
          </span>
        </Link>

        <Breadcrumbs
          items={[{ label: t("common.home"), href: routes.home }, { label: t("emergency.title") }]}
        />

        <section aria-labelledby="types-title" className="flex flex-col gap-3">
          <h2 id="types-title" className="text-xl font-bold">
            {t("emergency.types")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {ambulanceTypes(locale).map((type) => (
              <li
                key={type}
                className="rounded-full bg-cta-tint px-3 py-1.5 text-sm font-medium text-emergency"
              >
                {type}
              </li>
            ))}
          </ul>
        </section>

        {service.description && <Markdown>{service.description}</Markdown>}
        <FaqList faqs={service.faqs} />
      </div>
    </>
  );
}
