import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getMyRequests } from "@/features/requests/queries";
import {
  parseRequestFilter,
  REQUEST_FILTERS,
  type RequestFilter,
} from "@/features/requests/status";
import { relativeTime } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/requests">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("requests.mine.title") };
}

export default async function MyRequestsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/requests">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const { user } = await requireUser(routes.myRequests, locale);
  const filter = parseRequestFilter((await searchParams).status);
  const requests = await getMyRequests(user.id, filter, locale);

  return (
    <>
      <h1 className="text-2xl font-bold">{t("requests.mine.title")}</h1>
      <nav aria-label={t("requests.mine.filterNav")} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {(Object.keys(REQUEST_FILTERS) as RequestFilter[]).map((key) => (
            <li key={key}>
              <Link
                href={key === "all" ? routes.myRequests : `${routes.myRequests}?status=${key}`}
                aria-current={filter === key ? "page" : undefined}
                className={cn(
                  "inline-flex tap items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap",
                  filter === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {t(REQUEST_FILTERS[key].label)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {requests.length === 0 ? (
        <EmptyState
          icon="clipboard-list"
          title={filter === "all" ? t("requests.mine.emptyAll") : t("requests.mine.emptyFiltered")}
          description={t("requests.mine.emptyText")}
          action={{ href: routes.home, label: t("requests.mine.browse") }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.code}>
              <Link
                href={routes.myRequest(request.code)}
                className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{request.title}</span>
                  <StatusBadge kind="request" status={request.status} />
                </div>
                {request.summary && <span className="text-sm">{request.summary}</span>}
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">{request.code}</span> ·{" "}
                  {relativeTime(request.createdAt, locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
