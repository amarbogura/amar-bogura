"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { toBanglaDigits } from "@/lib/bangla";

const RESEND_SECONDS = 60;

/** Shared 6-digit OTP entry with a resend countdown (login + verify-phone). */
export function OtpStep({
  phoneNumber,
  pending,
  onVerify,
  onResend,
  onChangeNumber,
}: {
  phoneNumber: string;
  pending: boolean;
  onVerify: (code: string) => void;
  onResend: () => Promise<boolean>;
  onChangeNumber: () => void;
}) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (code.length === 6) onVerify(code);
      }}
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{formatBdPhoneDisplay(phoneNumber)}</span>{" "}
        নম্বরে একটি ৬ সংখ্যার কোড পাঠানো হয়েছে।
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="otp">কোড</Label>
        <InputOTP
          id="otp"
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={onVerify}
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={pending}
          aria-label="৬ সংখ্যার কোড"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" size="lg" disabled={pending || code.length !== 6}>
        {pending ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button type="button" variant="link" className="px-0" onClick={onChangeNumber}>
          নম্বর পরিবর্তন করুন
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0"
          disabled={secondsLeft > 0 || pending}
          onClick={async () => {
            if (await onResend()) {
              setCode("");
              setSecondsLeft(RESEND_SECONDS);
            }
          }}
        >
          {secondsLeft > 0 ? `আবার কোড পাঠান (${toBanglaDigits(secondsLeft)})` : "আবার কোড পাঠান"}
        </Button>
      </div>
    </form>
  );
}
