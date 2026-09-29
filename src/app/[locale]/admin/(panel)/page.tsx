import { Phone, Siren } from "lucide-react";

import { FormMessage } from "@/features/auth/components/form-message";
import {
  getDashboardCounts,
  getLatestNew,
  getOpenEmergencies,
  requestsPerDay,
} from "@/features/admin/dashboard/queries";
import { pick } from "@/i18n/content";
import { relativeTime, toLocaleDigits } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { telHref } from "@/lib/contact-links";
import { can } from "@/lib/permissions";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireAdminPage } from "@/lib/session";

export default async function AdminHomePage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const { user } = await requireAdminPage(undefined, locale);
  const { denied } = await searchParams;
  const showRequests = can(user.role, "requests.manage");
  const [counts, emergencies, latest, perDay] = await Promise.all([
    getDashboardCounts(),
    showRequests ? getOpenEmergencies() : Promise.resolve([]),
    showRequests ? getLatestNew() : Promise.resolve([]),
    requestsPerDay(7),
  ]);
  const n = (value: number) => toLocaleDigits(value, locale);
  const max = Math.max(1, ...perDay.map((d) => d.count));
  const weekday = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    weekday: "short",
    timeZone: "UTC",
  });

  const cards = [
    {
      label: t("admin.overview.newToday"),
      value: counts.newToday,
      href: "/admin/requests?status=NEW",
    },
    {
      label: t("admin.overview.openRequests"),
      value: counts.openRequests,
      href: "/admin/requests",
    },
    { label: t("admin.overview.pendingListings"), value: counts.pendingListings },
    { label: t("admin.overview.activeServices"), value: counts.activeServices },
    { label: t("admin.overview.users"), value: counts.users, href: "/admin/users" },
  ];

  return (
    <>
      {denied && <FormMessage message={t("admin.denied")} />}
      <h1 className="text-2xl font-bold">{t("admin.overview.title")}</h1>

      {showRequests && (
        <section aria-labelledby="emergency-title" className="flex flex-col gap-2">
          <h2 id="emergency-title" className="flex items-center gap-2 font-semibold text-emergency">
            <Siren className="size-5" aria-hidden="true" />
            {t("admin.overview.emergencies")}
          </h2>
          {emergencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.overview.noEmergencies")}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {emergencies.map((request) => (
                <li
                  key={request.code}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-emergency/40 bg-cta-tint p-3"
                >
                  <Link
                    href={`/admin/requests/${request.code}`}
                    className="min-w-0 hover:underline"
                  >
                    <span className="block font-semibold">
                      {request.service ? pick(request.service, "name", locale) : request.code}
                    </span>
                    <span className="block truncate text-sm">
                      {request.contactName} · {t(`status.request.${request.status}`)} ·{" "}
                      {relativeTime(request.createdAt, locale)}
                    </span>
                  </Link>
                  {telHref(request.contactPhone) && (
                    <a
                      href={telHref(request.contactPhone)!}
                      className="inline-flex tap shrink-0 items-center gap-1 rounded-lg bg-emergency px-3 text-sm font-semibold text-emergency-foreground"
                      aria-label={`${t("admin.request.call")} ${formatBdPhoneDisplay(request.contactPhone, locale)}`}
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {t("admin.request.call")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => {
          const body = (
            <>
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <span className="text-3xl font-bold">{n(card.value)}</span>
            </>
          );
          return (
            <li key={card.label}>
              {card.href ? (
                <Link
                  href={card.href}
                  className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 hover:border-primary/40"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="chart-title" className="rounded-xl border bg-card p-4">
        <h2 id="chart-title" className="mb-3 font-semibold">
          {t("admin.overview.last7")}
        </h2>
        <ol className="flex h-40 items-end gap-2">
          {perDay.map(({ day, count }) => {
            const label = weekday.format(new Date(`${day}T12:00:00Z`));
            return (
              <li
                key={day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                aria-label={t("admin.overview.chartLabel", { day: label, count: n(count) })}
              >
                <span className="text-xs font-medium" aria-hidden="true">
                  {n(count)}
                </span>
                <span
                  aria-hidden="true"
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
                />
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {showRequests && latest.length > 0 && (
        <section aria-labelledby="latest-title" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 id="latest-title" className="font-semibold">
              {t("admin.overview.latestNew")}
            </h2>
            <Link href="/admin/requests?status=NEW" className="text-sm text-primary underline">
              {t("admin.overview.viewAll")}
            </Link>
          </div>
          <ul className="divide-y rounded-xl border bg-card">
            {latest.map((request) => (
              <li key={request.code}>
                <Link
                  href={`/admin/requests/${request.code}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {request.service
                        ? pick(request.service, "name", locale)
                        : (request.title ?? t("admin.requests.custom"))}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-mono">{request.code}</span> · {request.contactName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(request.createdAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
