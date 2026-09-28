"use client";

import { CircleUserRound } from "lucide-react";
import { useT } from "@/i18n/client";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

/**
 * Header login/profile control. Reads the session client-side so public pages stay in the static
 * shell (Cache Components); the fixed size avoids layout shift while the session loads.
 */
export function AccountButton() {
  const { data, isPending } = authClient.useSession();
  const t = useT();

  if (isPending) {
    return <span aria-hidden="true" className="size-11 animate-pulse rounded-full bg-white/15" />;
  }
  if (!data) {
    return (
      <Link
        href={routes.login}
        className="inline-flex tap items-center justify-center rounded-md bg-white px-4 font-semibold text-primary hover:bg-white/90"
      >
        {t("common.login")}
      </Link>
    );
  }
  return (
    <Link
      href={routes.account}
      aria-label={t("nav.myProfile")}
      className="inline-flex tap items-center justify-center rounded-full text-white hover:bg-white/10"
    >
      <CircleUserRound className="size-7" aria-hidden="true" />
    </Link>
  );
}
