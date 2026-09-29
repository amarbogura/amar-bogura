import type { Metadata } from "next";

import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TwoFactorSetup } from "@/features/auth/components/two-factor-setup";
import { redirectTo } from "@/i18n/redirect";
import { getT, resolveLocale } from "@/i18n/server";
import { checkAdmin, getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/setup-2fa">): Promise<Metadata> {
  return {
    title: getT(await resolveLocale(params))("auth.twoFaTitle"),
    robots: { index: false, follow: false },
  };
}

/** Reachable only by an admin-role session that has not enrolled 2FA yet. */
export default async function SetupTwoFactorPage({
  params,
}: PageProps<"/[locale]/admin/setup-2fa">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const check = checkAdmin(await getSession());
  if (check.ok) redirectTo(locale, "/admin");
  if (check.reason === "no_session") redirectTo(locale, "/admin/login");
  if (check.reason !== "no_2fa") redirectTo(locale, "/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Logo alt={t("common.siteName")} priority className="mb-6 h-16 self-center" />
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">{t("auth.twoFaHeading")}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup />
        </CardContent>
      </Card>
    </main>
  );
}
