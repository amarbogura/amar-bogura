"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeBdPhone } from "@/lib/phone";

/** Phone number entry; validates and normalizes to E.164 before calling `onSubmit`. */
export function PhoneStep({
  pending,
  defaultValue = "",
  submitLabel = "কোড পাঠান",
  onSubmit,
}: {
  pending: boolean;
  defaultValue?: string;
  submitLabel?: string;
  onSubmit: (e164: string) => void;
}) {
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
          setError("সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।");
          return;
        }
        setError(null);
        onSubmit(e164);
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">মোবাইল নম্বর</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="০১৭XXXXXXXX"
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
        {pending ? "পাঠানো হচ্ছে…" : submitLabel}
      </Button>
    </form>
  );
}
