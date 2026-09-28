"use client";

import { useLocaleRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import { authClient, authErrorMessage } from "@/lib/auth-client";

import { FormMessage } from "./form-message";

/** D-04: email + password, then TOTP (or a backup code). First login without 2FA → setup page. */
export function AdminLoginForm() {
  const t = useT();
  const router = useLocaleRouter();
  const [step, setStep] = useState<"credentials" | "totp" | "backup">("credentials");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const goTo = (path: string) => {
    router.replace(path);
    router.refresh();
  };

  if (step === "credentials") {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            const { data, error: signInError } = await authClient.signIn.email({
              email: String(form.get("email") ?? "").trim(),
              password: String(form.get("password") ?? ""),
            });
            if (signInError) {
              setError(authErrorMessage(signInError, t));
              return;
            }
            setError(null);
            if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) setStep("totp");
            else goTo("/admin/setup-2fa");
          });
        }}
      >
        <FormMessage message={error} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("common.verifying") : t("common.login")}
        </Button>
      </form>
    );
  }

  const isBackup = step === "backup";
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const { error: verifyError } = isBackup
            ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
            : await authClient.twoFactor.verifyTotp({ code });
          if (verifyError) {
            setError(authErrorMessage(verifyError, t));
            setCode("");
            return;
          }
          goTo("/admin");
        });
      }}
    >
      <FormMessage message={error} />
      <p className="text-sm text-muted-foreground">
        {isBackup ? t("auth.backupPrompt") : t("auth.totpPrompt")}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{isBackup ? t("auth.backupCode") : t("auth.authCode")}</Label>
        {isBackup ? (
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            required
          />
        ) : (
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
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending || (!isBackup && code.length !== 6)}>
        {pending ? t("common.verifying") : t("common.verify")}
      </Button>
      <Button
        type="button"
        variant="link"
        className="self-start px-0"
        onClick={() => {
          setCode("");
          setError(null);
          setStep(isBackup ? "totp" : "backup");
        }}
      >
        {isBackup ? t("auth.useTotp") : t("auth.useBackup")}
      </Button>
    </form>
  );
}
