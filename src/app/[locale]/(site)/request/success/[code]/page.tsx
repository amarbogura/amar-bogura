import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { normalizeRequestCode } from "@/features/requests/code";
import { CopyCode } from "@/features/requests/components/copy-code";
import { getSiteSettings } from "@/features/site/queries";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { telHref, whatsappHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/request/success/[code]">): Promise<Metadata> {
  return {
    title: getT(await resolveLocale(params))("requests.success.metaTitle"),
    robots: { index: false, follow: false },
  };
}

const NEXT_STEPS = [
  "requests.success.step1",
  "requests.success.step2",
  "requests.success.step3",
] as const;

/** Shows only the code (no personal data), so opening it by URL reveals nothing. */
async function Success({
  params,
}: {
  params: PageProps<"/[locale]/request/success/[code]">["params"];
}) {
  const [locale, raw] = await Promise.all([resolveLocale(params), params]);
  const t = getT(locale);
  const code = normalizeRequestCode(decodeURIComponent(raw.code));
  if (!code) notFound();
  const settings = await getSiteSettings();
  const hotline = telHref(settings.hotline);
  const whatsapp = whatsappHref(settings.whatsapp, t("requests.success.whatsappText", { code }));

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{t("requests.success.title")}</h1>
        <p className="text-muted-foreground">{t("requests.success.keepCode")}</p>
        <CopyCode code={code} />
      </div>

      <section
        aria-labelledby="next-title"
        className="flex flex-col gap-2 rounded-2xl border bg-card p-4"
      >
        <h2 id="next-title" className="font-semibold">
          {t("requests.success.next")}
        </h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{t(step)}</li>
          ))}
        </ol>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {hotline && (
          <a
            href={hotline}
            className="flex tap items-center justify-center gap-2 rounded-xl border px-4 font-medium hover:bg-muted"
          >
            <Phone className="size-5" aria-hidden="true" />
            {t("common.hotline")} {formatBdPhoneDisplay(settings.hotline!, locale)}
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex tap items-center justify-center gap-2 rounded-xl border px-4 font-medium hover:bg-muted"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            {t("requests.success.whatsapp")}
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link href={routes.trackRequest(code)} className="font-semibold text-primary underline">
          {t("requests.success.viewStatus")}
        </Link>
        <p className="text-muted-foreground">
          {t("requests.success.myRequestsBefore")}{" "}
          <Link href={routes.myRequests} className="underline">
            {t("requests.mine.title")}
          </Link>
          {t("requests.success.myRequestsAfter")}
        </p>
        <Link href={routes.home} className="underline">
          {t("common.backHome")}
        </Link>
      </div>
    </>
  );
}

export default function RequestSuccessPage({
  params,
}: PageProps<"/[locale]/request/success/[code]">) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Success params={params} />
      </Suspense>
    </div>
  );
}
