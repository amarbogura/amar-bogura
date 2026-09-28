import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/features/auth/components/form-message";
import { GoogleButton } from "@/features/auth/components/google-button";
import { PhoneLoginForm } from "@/features/auth/components/phone-login-form";
import { safeNext } from "@/features/auth/safe-next";
import { redirectTo } from "@/i18n/redirect";
import { getT, resolveLocale } from "@/i18n/server";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  return {
    title: getT(await resolveLocale(params))("auth.loginTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const [locale, query] = await Promise.all([resolveLocale(params), searchParams]);
  const t = getT(locale);
  const next = safeNext(query.next);
  if (await getSession()) redirectTo(locale, next);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">{t("auth.loginHeading")}</h1>
          </CardTitle>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {query.error === "google" && <FormMessage message={t("auth.googleFailed")} />}
          <PhoneLoginForm next={next} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            {t("common.or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton next={next} />
          <p className="text-xs text-muted-foreground">{t("auth.loginOptional")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
