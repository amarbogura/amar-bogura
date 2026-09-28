"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/features/auth/components/form-message";
import { OtpStep } from "@/features/auth/components/otp-step";
import { normalizeBdPhone } from "@/lib/phone";
import { routes } from "@/lib/routes";

import { sendTrackOtp, verifyTrackOtp } from "../actions";
import { normalizeRequestCode } from "../code";

/** `/track` (D-03): request code + phone → OTP to that phone → read-only view. No account needed. */
export function TrackForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<{ code: string; phone: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(target: { code: string; phone: string }): Promise<boolean> {
    setPending(true);
    setError(null);
    const result = await sendTrackOtp(target);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setSentTo(target);
    return true;
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage message={error} />
        <p className="text-sm text-muted-foreground">
          কোড ও নম্বর মিললে আমরা একটি কোড পাঠিয়েছি। না পেলে কোড ও নম্বর আবার দেখে নিন।
        </p>
        <OtpStep
          phoneNumber={sentTo.phone}
          pending={pending}
          onChangeNumber={() => {
            setSentTo(null);
            setError(null);
          }}
          onResend={() => send(sentTo)}
          onVerify={async (otp) => {
            setPending(true);
            setError(null);
            const result = await verifyTrackOtp({ ...sentTo, otp });
            if (result.ok) {
              router.push(routes.trackRequest(result.code));
              return;
            }
            setPending(false);
            setError(result.error);
          }}
        />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const normalizedCode = normalizeRequestCode(code);
        const normalizedPhone = normalizeBdPhone(phone);
        if (!normalizedCode) return setError("রিকোয়েস্ট কোডটি সঠিক নয় (যেমন: AB-260928-0012)।");
        if (!normalizedPhone) return setError("সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)।");
        await send({ code: normalizedCode, phone: normalizedPhone });
      }}
    >
      <FormMessage message={error} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="track-code">রিকোয়েস্ট কোড</Label>
        <Input
          id="track-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="AB-260928-0012"
          autoCapitalize="characters"
          autoComplete="off"
          className="h-11 font-mono"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="track-phone">যে নম্বর দিয়ে রিকোয়েস্ট করেছিলেন</Label>
        <Input
          id="track-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01XXXXXXXXX"
          className="h-11"
        />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "পাঠানো হচ্ছে…" : "কোড পাঠান"}
      </Button>
    </form>
  );
}
