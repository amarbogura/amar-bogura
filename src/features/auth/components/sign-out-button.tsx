"use client";

import { useT } from "@/i18n/client";
import { useLocaleRouter } from "@/i18n/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  redirectTo = "/",
  className,
}: {
  redirectTo?: string;
  className?: string;
}) {
  const t = useT();
  const router = useLocaleRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace(redirectTo);
        router.refresh();
      }}
    >
      {pending ? t("common.loggingOut") : t("common.logout")}
    </Button>
  );
}
