import type { Metadata } from "next";

import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { redirectTo } from "@/i18n/redirect";
import { getT, resolveLocale } from "@/i18n/server";
import { checkAdmin, getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/login">): Promise<Metadata> {
  return {
    title: getT(await resolveLocale(params))("auth.adminLoginTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage({ params }: PageProps<"/[locale]/admin/login">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const check = checkAdmin(await getSession());
  if (check.ok) redirectTo(locale, "/admin");
  if (!check.ok && check.reason === "no_2fa") redirectTo(locale, "/admin/setup-2fa");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Logo alt={t("common.siteName")} priority className="mb-6 h-16 self-center" />
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">{t("auth.adminLoginTitle")}</h1>
          </CardTitle>
          <CardDescription>{t("auth.adminOnly")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
