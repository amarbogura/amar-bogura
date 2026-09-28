"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/components/form-message";
import { useLocale, useT } from "@/i18n/client";
import { localizePath } from "@/i18n/config";
import { authClient, authErrorMessage } from "@/lib/auth-client";

/** D-02: a phone user may link Google later (explicit linking only — implicit linking is off). */
export function LinkedAccounts({ googleLinked }: { googleLinked: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (googleLinked) {
    return <p className="text-sm text-muted-foreground">{t("account.googleConnected")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{t("account.googleLinkHelp")}</p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const { error: linkError } = await authClient.linkSocial({
            provider: "google",
            callbackURL: localizePath(locale, "/account?linked=google"),
          });
          if (linkError) {
            setError(authErrorMessage(linkError, t));
            setPending(false);
          }
        }}
      >
        {pending ? t("auth.googleRedirecting") : t("account.linkGoogle")}
      </Button>
      <FormMessage message={error} />
    </div>
  );
}
