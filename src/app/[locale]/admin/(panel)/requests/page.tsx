import type { Metadata } from "next";

import { StatusBadge } from "@/components/status-badge";
import { getAreaGroups } from "@/features/account/queries";
import { ExportCsvButton } from "@/features/admin/components/export-csv-button";
import {
  activeView,
  parseRequestFilters,
  type RequestFilters,
  SAVED_VIEWS,
  type SavedView,
  serializeRequestFilters,
} from "@/features/admin/requests/filters";
import {
  getFilterOptions,
  listAdminRequests,
  listAssignableAdmins,
} from "@/features/admin/requests/queries";
import { RequestPriority, RequestSource, RequestStatus } from "@/generated/prisma/enums";
import { localizePath } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { relativeTime, toLocaleDigits } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireAdminPage } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/requests">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("admin.requests.title") };
}

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const inputClass = selectClass;

const priorityTone = {
  NORMAL: "text-muted-foreground",
  HIGH: "text-cta font-semibold",
  EMERGENCY: "text-emergency font-bold",
} as const;

export default async function AdminRequestsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/requests">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const { user } = await requireAdminPage("requests.manage", locale);
  const filters = parseRequestFilters(await searchParams);
  const [list, options, areaGroups, admins] = await Promise.all([
    listAdminRequests(filters, user.id),
    getFilterOptions(),
    getAreaGroups(locale),
    listAssignableAdmins(),
  ]);
  const n = (value: number) => toLocaleDigits(value, locale);
  const view = activeView(filters);
  const href = (next: RequestFilters) => `/admin/requests${serializeRequestFilters(next)}`;
  const f = (key: keyof RequestFilters) => (filters[key] ?? "") as string;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("admin.requests.title")}</h1>
        <ExportCsvButton filters={filters} />
      </div>

      <nav aria-label={t("admin.requests.title")} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {(Object.keys(SAVED_VIEWS) as SavedView[]).map((key) => (
            <li key={key}>
              <Link
                href={href(SAVED_VIEWS[key])}
                aria-current={view === key ? "page" : undefined}
                className={cn(
                  "inline-flex tap items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap",
                  view === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {t(`admin.requests.views.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <details className="rounded-xl border bg-card p-3 md:open:p-4" open={!view}>
        <summary className="cursor-pointer font-medium">
          {t("admin.requests.filters.title")}
        </summary>
        {/* Plain GET form: filters live in the URL (shareable, Back button works, no JS needed). */}
        <form
          method="get"
          action={localizePath(locale, "/admin/requests")}
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            {t("admin.requests.filters.q")}
            <input
              name="q"
              defaultValue={f("q")}
              placeholder={t("admin.requests.filters.qPlaceholder")}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.status")}
            <select name="status" defaultValue={f("status")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {Object.values(RequestStatus).map((status) => (
                <option key={status} value={status}>
                  {t(`status.request.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.priority")}
            <select name="priority" defaultValue={f("priority")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {Object.values(RequestPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {t(`admin.priority.${priority}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.category")}
            <select name="category" defaultValue={f("category")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {options.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {pick(category, "name", locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.service")}
            <select name="service" defaultValue={f("service")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {options.services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {pick(service, "name", locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.area")}
            <select name="area" defaultValue={f("area")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {areaGroups.map((group) => (
                <optgroup key={group.id} label={group.name}>
                  {group.areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.assignee")}
            <select name="assignee" defaultValue={f("assignee")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              <option value="me">{t("admin.requests.filters.me")}</option>
              <option value="none">{t("admin.requests.filters.none")}</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.source")}
            <select name="source" defaultValue={f("source")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              {Object.values(RequestSource).map((source) => (
                <option key={source} value={source}>
                  {t(`admin.source.${source}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.who")}
            <select name="who" defaultValue={f("who")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              <option value="guest">{t("admin.requests.filters.guest")}</option>
              <option value="user">{t("admin.requests.filters.user")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.spam")}
            <select name="spam" defaultValue={f("spam")} className={selectClass}>
              <option value="">{t("admin.requests.filters.any")}</option>
              <option value="only">{t("admin.requests.filters.spamOnly")}</option>
              <option value="all">{t("admin.requests.filters.spamAll")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.from")}
            <input type="date" name="from" defaultValue={f("from")} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.requests.filters.to")}
            <input type="date" name="to" defaultValue={f("to")} className={inputClass} />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex tap items-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
            >
              {t("admin.requests.filters.apply")}
            </button>
            <Link
              href="/admin/requests"
              className="inline-flex tap items-center px-3 text-sm underline"
            >
              {t("admin.requests.filters.reset")}
            </Link>
          </div>
        </form>
      </details>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("admin.requests.count", { count: n(list.total) })}
      </p>

      {list.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t("admin.requests.empty")}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  {(
                    [
                      "code",
                      "service",
                      "contact",
                      "area",
                      "priority",
                      "status",
                      "assignee",
                      "created",
                    ] as const
                  ).map((column) => (
                    <th key={column} scope="col" className="px-3 py-2 font-medium">
                      {t(`admin.requests.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.rows.map((row) => (
                  <tr key={row.id} className={cn(row.priority === "EMERGENCY" && "bg-cta-tint")}>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/requests/${row.code}`}
                        className="font-mono font-medium text-primary underline"
                      >
                        {row.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {row.service
                        ? pick(row.service, "name", locale)
                        : (row.title ?? t("admin.requests.custom"))}
                      {row.isSpam && (
                        <span className="ml-2 rounded bg-destructive/10 px-1.5 text-xs text-destructive">
                          {t("admin.requests.spam")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.contactName}
                      <span className="block text-xs text-muted-foreground">
                        {formatBdPhoneDisplay(row.contactPhone, locale)}
                        {row.isGuest && ` · ${t("admin.requests.guest")}`}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.area ? pick(row.area, "name", locale) : "—"}</td>
                    <td className={cn("px-3 py-2", priorityTone[row.priority])}>
                      {t(`admin.priority.${row.priority}`)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge kind="request" status={row.status} />
                    </td>
                    <td className="px-3 py-2">
                      {row.assignedTo?.name ?? t("admin.requests.unassigned")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {relativeTime(row.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2 md:hidden">
            {list.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/requests/${row.code}`}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border bg-card p-3",
                    row.priority === "EMERGENCY" && "border-emergency/50 bg-cta-tint",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold">
                      {row.service
                        ? pick(row.service, "name", locale)
                        : (row.title ?? t("admin.requests.custom"))}
                    </span>
                    <StatusBadge kind="request" status={row.status} />
                  </span>
                  <span className="text-sm">
                    {row.contactName} · {formatBdPhoneDisplay(row.contactPhone, locale)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-mono">{row.code}</span> ·{" "}
                    <span className={priorityTone[row.priority]}>
                      {t(`admin.priority.${row.priority}`)}
                    </span>{" "}
                    · {relativeTime(row.createdAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {list.pages > 1 && (
        <nav
          className="flex items-center justify-between gap-2"
          aria-label={t("admin.requests.pageOf", { page: n(list.page), pages: n(list.pages) })}
        >
          {list.page > 1 ? (
            <Link
              href={href({ ...filters, page: list.page - 1 })}
              className="inline-flex tap items-center px-3 underline"
            >
              {t("admin.requests.prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t("admin.requests.pageOf", { page: n(list.page), pages: n(list.pages) })}
          </span>
          {list.page < list.pages ? (
            <Link
              href={href({ ...filters, page: list.page + 1 })}
              className="inline-flex tap items-center px-3 underline"
            >
              {t("admin.requests.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
