import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { TrackForm } from "@/features/requests/components/track-form";
import { localeAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/track">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  return {
    title: t("requests.track.metaTitle"),
    description: t("requests.track.metaDescription"),
    alternates: localeAlternates(locale, routes.track),
  };
}

async function TrackFormWithCode({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/track">["searchParams"];
}) {
  const { code } = await searchParams;
  return <TrackForm initialCode={typeof code === "string" ? code : ""} />;
}

/** D-03: guests track with request code + OTP to the request phone. */
export default async function TrackPage({ params, searchParams }: PageProps<"/[locale]/track">) {
  const t = getT(await resolveLocale(params));
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("requests.track.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("requests.track.intro")}</p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <TrackFormWithCode searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        {t("requests.track.loginBefore")}{" "}
        <Link href={`/login?next=${encodeURIComponent(routes.myRequests)}`} className="underline">
          {t("requests.track.loginLink")}
        </Link>{" "}
        {t("requests.track.loginAfter")}
      </p>
    </div>
  );
}
