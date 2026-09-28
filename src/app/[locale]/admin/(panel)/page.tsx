import { FormMessage } from "@/features/auth/components/form-message";
import { getT, resolveLocale } from "@/i18n/server";
import { requireAdminPage } from "@/lib/session";

// Placeholder dashboard — P8 builds the overview, requests, users and audit screens.
export default async function AdminHomePage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  const t = getT(locale);
  const { user } = await requireAdminPage(undefined, locale);
  const { denied } = await searchParams;
  return (
    <>
      {denied && <FormMessage message={t("admin.denied")} />}
      <h1 className="text-2xl font-bold">{t("admin.welcome", { name: user.name })}</h1>
      <p className="text-muted-foreground">{t("admin.comingSoon")}</p>
    </>
  );
}
