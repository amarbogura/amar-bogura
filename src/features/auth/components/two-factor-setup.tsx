"use client";

import { useLocaleRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import { authClient, authErrorMessage } from "@/lib/auth-client";

import { FormMessage } from "./form-message";

/** D-04: mandatory TOTP enrollment for admins (password → QR + backup codes → first code). */
export function TwoFactorSetup() {
  const t = useT();
  const router = useLocaleRouter();
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(
    null,
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enrollment) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const password = String(new FormData(event.currentTarget).get("password") ?? "");
          startTransition(async () => {
            const { data, error: enableError } = await authClient.twoFactor.enable({ password });
            if (enableError || !data || !("totpURI" in data)) {
              setError(authErrorMessage(enableError ?? {}, t));
              return;
            }
            setError(null);
            setEnrollment({ totpURI: data.totpURI, backupCodes: data.backupCodes });
          });
        }}
      >
        <FormMessage message={error} />
        <p className="text-sm text-muted-foreground">{t("auth.twoFaIntro")}</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("auth.preparing") : t("common.continue")}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code });
          if (verifyError) {
            setError(authErrorMessage(verifyError, t));
            setCode("");
            return;
          }
          router.replace("/admin");
          router.refresh();
        });
      }}
    >
      <FormMessage message={error} />
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>{t("auth.twoFaStep1")}</li>
        <li>{t("auth.twoFaStep2")}</li>
        <li>{t("auth.twoFaStep3")}</li>
      </ol>
      <div className="self-center rounded-lg bg-white p-3">
        <QRCode value={enrollment.totpURI} size={192} aria-label={t("auth.qrAria")} />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">{t("auth.cantScan")}</summary>
        <p className="mt-2 font-mono text-xs break-all">
          {new URL(enrollment.totpURI).searchParams.get("secret")}
        </p>
      </details>
      <div className="flex flex-col gap-2 rounded-md border border-cta/40 bg-cta/5 p-3">
        <p className="text-sm font-medium">{t("auth.backupTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("auth.backupHelp")}</p>
        <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
          {enrollment.backupCodes.map((backupCode) => (
            <li key={backupCode}>{backupCode}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{t("auth.appCode")}</Label>
        <InputOTP
          id="code"
          maxLength={6}
          value={code}
          onChange={setCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t("auth.otpAria")}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" size="lg" disabled={pending || code.length !== 6}>
        {pending ? t("common.verifying") : t("auth.enable2fa")}
      </Button>
    </form>
  );
}
