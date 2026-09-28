import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { RequestFormSection } from "@/features/requests/components/request-form-section";
import { resolveCustomRequestForm } from "@/features/requests/resolve-form";
import { localeAlternates } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/request/custom">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  return {
    title: t("requests.custom.metaTitle"),
    description: t("requests.custom.metaDescription"),
    alternates: localeAlternates(locale, routes.customRequest),
  };
}

/** D-07: custom request = its own template, type CUSTOM, no service. */
export default async function CustomRequestPage({ params }: PageProps<"/[locale]/request/custom">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const form = await resolveCustomRequestForm();
  if (!form) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 md:py-8">
      <Breadcrumbs
        items={[
          { label: t("common.home"), href: routes.home },
          { label: t("requests.custom.title") },
        ]}
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("requests.custom.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("requests.custom.intro")}</p>
      </div>
      <RequestFormSection form={form} path={routes.customRequest} locale={locale} />
    </div>
  );
}
