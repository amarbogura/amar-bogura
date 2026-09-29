import type { Metadata } from "next";

import { listUsers, parseUserFilters } from "@/features/admin/users/queries";
import { localizePath } from "@/i18n/config";
import { formatDate, toLocaleDigits } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { isRole, ROLES } from "@/lib/permissions";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireAdminPage } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/users">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("admin.users.title") };
}

const fieldClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function AdminUsersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/users">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  await requireAdminPage("users.manage", locale);
  const filters = parseUserFilters(await searchParams);
  const list = await listUsers(filters);
  const n = (value: number) => toLocaleDigits(value, locale);
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.role) query.set("role", filters.role);
    if (filters.banned) query.set("banned", "1");
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return `/admin/users${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{t("admin.users.title")}</h1>
      <form
        method="get"
        action={localizePath(locale, "/admin/users")}
        className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1 text-sm">
          {t("admin.users.search")}
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder={t("admin.users.searchPlaceholder")}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("admin.users.role")}
          <select name="role" defaultValue={filters.role ?? ""} className={fieldClass}>
            <option value="">{t("admin.users.anyRole")}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("admin.users.status")}
          <select name="banned" defaultValue={filters.banned ? "1" : ""} className={fieldClass}>
            <option value="">{t("admin.users.anyStatus")}</option>
            <option value="1">{t("admin.users.onlyBanned")}</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex tap items-center justify-center self-end rounded-md bg-primary px-5 font-medium text-primary-foreground"
        >
          {t("admin.users.search")}
        </button>
      </form>

      {list.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t("admin.users.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {list.rows.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/users/${user.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.phoneNumber ? formatBdPhoneDisplay(user.phoneNumber, locale) : user.email}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {isRole(user.role) ? t(`roles.${user.role}`) : user.role}
                  </span>
                  {user.banned && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                      {t("admin.users.banned")}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {formatDate(user.createdAt, locale)}
                  </span>
                </span>
              </Link>
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
