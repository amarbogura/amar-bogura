"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import { normalizeBdPhone } from "@/lib/phone";

/** Phone number entry; validates and normalizes to E.164 before calling `onSubmit`. */
export function PhoneStep({
  pending,
  defaultValue = "",
  submitLabel,
  onSubmit,
}: {
  pending: boolean;
  defaultValue?: string;
  submitLabel?: string;
  onSubmit: (e164: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const e164 = normalizeBdPhone(value);
        if (!e164) {
          setError(t("auth.phoneInvalid"));
          return;
        }
        setError(null);
        onSubmit(e164);
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("auth.phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("auth.phonePlaceholder")}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
          disabled={pending}
          required
        />
        {error && (
          <p id="phone-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("common.sending") : (submitLabel ?? t("common.sendCode"))}
      </Button>
    </form>
  );
}
