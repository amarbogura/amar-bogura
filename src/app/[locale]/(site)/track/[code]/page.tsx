import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { getAreaGroups } from "@/features/account/queries";
import { normalizeRequestCode } from "@/features/requests/code";
import { RequestDetail } from "@/features/requests/components/request-detail";
import { getTrackedRequest } from "@/features/requests/queries";
import { redirectTo } from "@/i18n/redirect";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/track/[code]">): Promise<Metadata> {
  return {
    title: getT(await resolveLocale(params))("requests.track.statusTitle"),
    robots: { index: false, follow: false },
  };
}

async function Tracked({ params }: { params: PageProps<"/[locale]/track/[code]">["params"] }) {
  const [locale, { code: rawCode }] = await Promise.all([resolveLocale(params), params]);
  const raw = decodeURIComponent(rawCode);
  const code = normalizeRequestCode(raw);
  const request = code ? await getTrackedRequest(code) : null;
  // No valid OTP cookie for this code → verify first (the form keeps the code).
  if (!request) redirectTo(locale, `${routes.track}?code=${encodeURIComponent(code ?? raw)}`);
  return (
    <RequestDetail request={request} areaGroups={await getAreaGroups(locale)} locale={locale} />
  );
}

export default function TrackedRequestPage({ params }: PageProps<"/[locale]/track/[code]">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Tracked params={params} />
      </Suspense>
    </div>
  );
}
