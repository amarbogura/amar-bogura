"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/components/form-message";
import { useT } from "@/i18n/client";

import { cancelRequest } from "../actions";

export function CancelRequestButton({ code }: { code: string }) {
  const router = useRouter();
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="outline" size="lg" onClick={() => setConfirming(true)}>
        {t("requests.cancel.button")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-3" role="group">
      <p className="font-medium">{t("requests.cancel.confirm")}</p>
      <FormMessage message={error} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="lg"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await cancelRequest({ code });
            setPending(false);
            if (!result.ok) return setError(result.error);
            setConfirming(false);
            router.refresh();
          }}
        >
          {pending ? t("requests.cancel.cancelling") : t("requests.cancel.yes")}
        </Button>
        <Button variant="ghost" size="lg" disabled={pending} onClick={() => setConfirming(false)}>
          {t("requests.cancel.no")}
        </Button>
      </div>
    </div>
  );
}
