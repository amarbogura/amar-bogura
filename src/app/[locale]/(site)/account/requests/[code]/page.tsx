import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAreaGroups } from "@/features/account/queries";
import { normalizeRequestCode } from "@/features/requests/code";
import { RequestDetail } from "@/features/requests/components/request-detail";
import { getMyRequest } from "@/features/requests/queries";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/requests/[code]">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("requests.mine.detailTitle") };
}

export default async function MyRequestPage({
  params,
}: PageProps<"/[locale]/account/requests/[code]">) {
  const [locale, { code: rawCode }] = await Promise.all([resolveLocale(params), params]);
  const t = getT(locale);
  const raw = decodeURIComponent(rawCode);
  const { user } = await requireUser(routes.myRequest(raw), locale);
  const code = normalizeRequestCode(raw);
  // Owner-scoped query: someone else's code is indistinguishable from a missing one.
  const request = code ? await getMyRequest(user.id, code) : null;
  if (!request) notFound();

  return (
    <>
      <Link href={routes.myRequests} className="text-sm text-primary underline">
        {t("requests.mine.back")}
      </Link>
      <RequestDetail request={request} areaGroups={await getAreaGroups(locale)} locale={locale} />
    </>
  );
}
