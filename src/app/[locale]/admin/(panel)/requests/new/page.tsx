import type { Metadata } from "next";

import { getAreaGroups } from "@/features/account/queries";
import { PhoneRequestForm } from "@/features/admin/components/phone-request-form";
import { getFilterOptions } from "@/features/admin/requests/queries";
import { initialValues } from "@/features/forms/defaults";
import { tr } from "@/features/forms/schema-utils";
import {
  resolveCustomRequestForm,
  resolveServiceRequestForm,
} from "@/features/requests/resolve-form";
import { localizePath } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { requireAdminPage } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/requests/new">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("admin.newRequest.title") };
}

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function NewPhoneRequestPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/requests/new">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  await requireAdminPage("requests.manage", locale);
  const raw = (await searchParams).service;
  const chosen = typeof raw === "string" ? raw.slice(0, 100) : "";

  const form = !chosen
    ? null
    : chosen === "custom"
      ? await resolveCustomRequestForm()
      : await resolveServiceRequestForm(chosen);

  if (!form) {
    const { categories, services } = await getFilterOptions();
    return (
      <>
        <h1 className="text-2xl font-bold">{t("admin.newRequest.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.newRequest.intro")}</p>
        <form
          method="get"
          action={localizePath(locale, "/admin/requests/new")}
          className="flex max-w-xl flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("admin.newRequest.service")}
            <select name="service" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                {t("admin.newRequest.choose")}
              </option>
              {categories.map((category) => {
                const items = services.filter((service) => service.category.slug === category.slug);
                return items.length ? (
                  <optgroup key={category.slug} label={pick(category, "name", locale)}>
                    {items.map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {pick(service, "name", locale)}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
              <option value="custom">{t("admin.newRequest.custom")}</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex tap items-center justify-center self-start rounded-md bg-primary px-5 font-medium text-primary-foreground"
          >
            {t("admin.newRequest.next")}
          </button>
        </form>
      </>
    );
  }

  const areaGroups = await getAreaGroups(locale);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {t("admin.newRequest.title")} — {tr(form.title, locale)}
        </h1>
        <Link href="/admin/requests/new" className="text-sm text-primary underline">
          {t("admin.newRequest.change")}
        </Link>
      </div>
      <PhoneRequestForm
        target={form.type === "CUSTOM" ? { kind: "custom" } : { kind: "service", slug: form.slug }}
        schema={form.schema}
        presets={form.presets}
        areaGroups={areaGroups}
        defaultValues={initialValues(form.schema, { presets: form.presets })}
      />
    </div>
  );
}
