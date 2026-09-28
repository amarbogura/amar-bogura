import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedAccounts } from "@/features/account/components/linked-accounts";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getAreaGroups, getLinkedProviders, getUserAreaId } from "@/features/account/queries";
import { FormMessage } from "@/features/auth/components/form-message";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale } from "@/i18n/server";
import { isTempName } from "@/lib/auth-policy";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("account.profileTitle") };
}

export default async function AccountPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const { user } = await requireUser("/account", locale);
  const [areaGroups, providers, areaId, query] = await Promise.all([
    getAreaGroups(locale),
    getLinkedProviders(user.id),
    getUserAreaId(user.id),
    searchParams,
  ]);
  const phoneVerified = !!user.phoneNumber && user.phoneNumberVerified;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("account.profileTitle")}</h1>
        <SignOutButton />
      </div>

      {query.linked === "google" && <FormMessage tone="info" message={t("account.googleLinked")} />}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">{t("account.phoneSection")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {phoneVerified ? (
            <p className="text-lg font-medium">
              {formatBdPhoneDisplay(user.phoneNumber!, locale)}{" "}
              <span className="text-sm font-normal text-primary">{t("account.verified")}</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("account.verifyNeeded")}</p>
              <Link
                href="/account/verify-phone"
                className="inline-flex tap items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
              >
                {t("account.verifyPhone")}
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">{t("account.personal")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={isTempName(user.name, user.phoneNumber) ? "" : user.name}
            areaId={areaId}
            areaGroups={areaGroups}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">{t("account.loginMethods")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedAccounts googleLinked={providers.includes("google")} />
        </CardContent>
      </Card>
    </>
  );
}
