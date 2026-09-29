import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { UserAdminPanel } from "@/features/admin/components/user-admin-panel";
import { getUserDetail } from "@/features/admin/users/queries";
import { pick } from "@/i18n/content";
import { formatDate } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { can, isRole } from "@/lib/permissions";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireAdminPage } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/users/[id]">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("admin.users.profile") };
}

export default async function AdminUserPage({ params }: PageProps<"/[locale]/admin/users/[id]">) {
  const [locale, { id }] = await Promise.all([resolveLocale(params), params]);
  const t = getT(locale);
  const { user: me } = await requireAdminPage("users.manage", locale);
  const user = await getUserDetail(decodeURIComponent(id));
  if (!user) notFound();
  const role = isRole(user.role) ? user.role : "user";

  return (
    <>
      <Link href="/admin/users" className="text-sm text-primary underline">
        {t("admin.users.back")}
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {t(`roles.${role}`)} · {formatDate(user.createdAt, locale)}
          {user.twoFactorEnabled && ` · ${t("admin.users.twoFactor")}`}
        </p>
        {user.banned && (
          <p className="font-medium text-destructive">
            {t("admin.users.bannedBecause", { reason: user.banReason ?? "—" })}
          </p>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <dl className="grid gap-2 rounded-xl border bg-card p-4 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t("admin.users.columns.phone")}</dt>
            <dd>{user.phoneNumber ? formatBdPhoneDisplay(user.phoneNumber, locale) : "—"}</dd>
            <dt className="text-muted-foreground">{t("admin.users.email")}</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-muted-foreground">{t("account.area")}</dt>
            <dd>{user.area ? pick(user.area, "name", locale) : "—"}</dd>
            <dt className="text-muted-foreground">{t("admin.users.language")}</dt>
            <dd>{t(`admin.languages.${user.locale === "en" ? "en" : "bn"}`)}</dd>
          </dl>

          <section aria-labelledby="user-requests" className="flex flex-col gap-2">
            <h2 id="user-requests" className="font-semibold">
              {t("admin.users.requests")}
            </h2>
            {user.requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.users.noRequests")}</p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {user.requests.map((request) => (
                  <li key={request.code}>
                    <Link
                      href={`/admin/requests/${request.code}`}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">
                          {request.service
                            ? pick(request.service, "name", locale)
                            : (request.title ?? t("admin.requests.custom"))}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {request.code}
                        </span>
                      </span>
                      <StatusBadge kind="request" status={request.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="user-listings" className="flex flex-col gap-2">
            <h2 id="user-listings" className="font-semibold">
              {t("admin.users.listings")}
            </h2>
            {user.listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.users.noListings")}</p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {user.listings.map((listing) => (
                  <li
                    key={listing.code}
                    className="flex items-center justify-between gap-2 px-4 py-3"
                  >
                    <span className="truncate">{listing.title}</span>
                    <StatusBadge kind="listing" status={listing.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <UserAdminPanel
          userId={user.id}
          banned={user.banned}
          role={role}
          canBan={user.id !== me.id}
          canChangeRole={can(me.role, "admins.manage") && user.id !== me.id}
        />
      </div>
    </>
  );
}
