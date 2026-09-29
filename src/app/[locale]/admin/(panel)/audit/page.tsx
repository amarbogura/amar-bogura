import type { Metadata } from "next";

import { listAuditLogs, parseAuditFilters } from "@/features/admin/audit/queries";
import { localizePath } from "@/i18n/config";
import { formatDateTime, toLocaleDigits } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { requireAdminPage } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/audit">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("admin.audit.title") };
}

const fieldClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const json = (value: unknown) => (value == null ? "—" : JSON.stringify(value, null, 2));

/** SUPER_ADMIN only (audit.view): who changed what, when. Rows are read-only. */
export default async function AdminAuditPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/audit">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  await requireAdminPage("audit.view", locale);
  const filters = parseAuditFilters(await searchParams);
  const list = await listAuditLogs(filters);
  const n = (value: number) => toLocaleDigits(value, locale);
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    for (const key of ["action", "entity", "actor", "from", "to"] as const) {
      if (filters[key]) query.set(key, filters[key]!);
    }
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return `/admin/audit${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{t("admin.audit.title")}</h1>
      <form
        method="get"
        action={localizePath(locale, "/admin/audit")}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1 text-sm lg:col-span-2">
          {t("admin.audit.action")}
          <input
            name="action"
            defaultValue={filters.action ?? ""}
            placeholder={t("admin.audit.filterAction")}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("admin.requests.filters.from")}
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("admin.requests.filters.to")}
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={fieldClass} />
        </label>
        {filters.entity && <input type="hidden" name="entity" value={filters.entity} />}
        {filters.actor && <input type="hidden" name="actor" value={filters.actor} />}
        <button
          type="submit"
          className="inline-flex tap items-center justify-center self-end rounded-md bg-primary px-5 font-medium text-primary-foreground"
        >
          {t("admin.requests.filters.apply")}
        </button>
      </form>

      {list.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t("admin.audit.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {list.rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <details>
                <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-sm font-semibold">{row.action}</span>
                  <span className="text-sm">
                    {row.entityType} ·{" "}
                    <Link
                      href={`/admin/audit?entity=${encodeURIComponent(row.entityId)}`}
                      className="font-mono underline"
                    >
                      {row.entityId}
                    </Link>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {row.actor ? (
                      <Link href={`/admin/audit?actor=${row.actor.id}`} className="underline">
                        {row.actor.name}
                      </Link>
                    ) : (
                      t("admin.audit.system")
                    )}{" "}
                    · {formatDateTime(row.createdAt, locale)}
                  </span>
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("admin.audit.before")}
                    </p>
                    <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                      {json(row.before)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("admin.audit.after")}
                    </p>
                    <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                      {json(row.after)}
                    </pre>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {list.pages > 1 && (
        <nav
          className="flex items-center justify-between"
          aria-label={t("admin.requests.pageOf", { page: n(list.page), pages: n(list.pages) })}
        >
          {list.page > 1 ? (
            <Link href={pageHref(list.page - 1)} className="underline">
              {t("admin.requests.prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t("admin.requests.pageOf", { page: n(list.page), pages: n(list.pages) })}
          </span>
          {list.page < list.pages ? (
            <Link href={pageHref(list.page + 1)} className="underline">
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
