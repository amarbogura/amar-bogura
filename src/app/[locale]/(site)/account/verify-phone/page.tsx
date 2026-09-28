import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyPhoneForm } from "@/features/auth/components/verify-phone-form";
import { safeNext } from "@/features/auth/safe-next";
import { redirectTo } from "@/i18n/redirect";
import { getT, resolveLocale } from "@/i18n/server";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/verify-phone">): Promise<Metadata> {
  return { title: getT(await resolveLocale(params))("auth.verifyPhoneTitle") };
}

export default async function VerifyPhonePage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/verify-phone">) {
  const [locale, query] = await Promise.all([resolveLocale(params), searchParams]);
  const t = getT(locale);
  const next = safeNext(query.next);
  const { user } = await requireUser("/account/verify-phone", locale);
  if (user.phoneNumber && user.phoneNumberVerified) redirectTo(locale, next);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">{t("auth.verifyPhoneHeading")}</h1>
        </CardTitle>
        <CardDescription>{t("auth.verifyPhoneWhy")}</CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyPhoneForm next={next} />
      </CardContent>
    </Card>
  );
}
