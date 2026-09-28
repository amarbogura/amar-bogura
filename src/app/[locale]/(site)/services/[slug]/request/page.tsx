import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageSkeleton } from "@/components/skeletons";
import { tr } from "@/features/forms/schema-utils";
import { EmergencyCallBar } from "@/features/requests/components/emergency-call-bar";
import { RequestFormSection } from "@/features/requests/components/request-form-section";
import {
  getRequestFormStaticParams,
  resolveServiceRequestForm,
} from "@/features/requests/resolve-form";
import { getSiteSettings } from "@/features/site/queries";
import type { Locale } from "@/i18n/config";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";

export async function generateStaticParams() {
  return getRequestFormStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]/request">): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  const form = await resolveServiceRequestForm(slug);
  if (!form) return {};
  return {
    title: getT(locale)("requests.requestTitle", { name: tr(form.title, locale) }),
    // The service page is the indexable one; the form is a step in its flow.
    robots: { index: false, follow: true },
  };
}

async function ServiceRequest({ slug, locale }: { slug: string; locale: Locale }) {
  const t = getT(locale);
  const form = await resolveServiceRequestForm(slug);
  if (!form) notFound();
  const settings = form.isEmergency ? await getSiteSettings() : null;
  const name = tr(form.title, locale);

  return (
    <>
      {settings && <EmergencyCallBar ambulancePhone={settings.ambulancePhone} />}
      <Breadcrumbs
        items={[
          { label: t("common.home"), href: routes.home },
          ...(form.category && !form.isEmergency
            ? [{ label: tr(form.category.name, locale), href: routes.service(form.category.slug) }]
            : []),
          { label: name, href: routes.service(slug) },
          { label: t("requests.requestCrumb") },
        ]}
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("requests.requestHeading", { name })}</h1>
        <p className="text-sm text-muted-foreground">{t("requests.requestIntro")}</p>
      </div>
      <RequestFormSection form={form} path={routes.serviceRequest(slug)} locale={locale} />
    </>
  );
}

async function ServiceRequestLoader({
  params,
}: {
  params: PageProps<"/[locale]/services/[slug]/request">["params"];
}) {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  return <ServiceRequest slug={slug} locale={locale} />;
}

/**
 * docs/04 P7: the service's form (no login gate — D-03). Known services prerender fully; the
 * Suspense boundary lets admin-added slugs stream on demand.
 */
export default function ServiceRequestPage({
  params,
}: PageProps<"/[locale]/services/[slug]/request">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 md:py-8">
      <Suspense fallback={<PageSkeleton />}>
        <ServiceRequestLoader params={params} />
      </Suspense>
    </div>
  );
}
