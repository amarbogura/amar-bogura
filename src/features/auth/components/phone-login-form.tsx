"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/features/account/actions";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { isTempName } from "@/lib/auth-policy";

import { FormMessage } from "./form-message";
import { OtpStep } from "./otp-step";
import { PhoneStep } from "./phone-step";

type Step = "phone" | "otp" | "name";

/** D-02 phone login: phone → OTP → (first login) name → `next`. */
export function PhoneLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  const sendOtp = async (e164: string) => {
    const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: e164 });
    if (sendError) {
      setError(authErrorMessage(sendError));
      return false;
    }
    setError(null);
    return true;
  };

  if (step === "phone") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage message={error} />
        <PhoneStep
          pending={pending}
          defaultValue={phoneNumber}
          onSubmit={(e164) =>
            startTransition(async () => {
              if (await sendOtp(e164)) {
                setPhoneNumber(e164);
                setStep("otp");
              }
            })
          }
        />
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage message={error} />
        <OtpStep
          phoneNumber={phoneNumber}
          pending={pending}
          onResend={() => sendOtp(phoneNumber)}
          onChangeNumber={() => {
            setError(null);
            setStep("phone");
          }}
          onVerify={(code) =>
            startTransition(async () => {
              const { data, error: verifyError } = await authClient.phoneNumber.verify({
                phoneNumber,
                code,
              });
              if (verifyError || !data) {
                setError(authErrorMessage(verifyError ?? {}));
                return;
              }
              setError(null);
              if (isTempName(data.user?.name, phoneNumber)) setStep("name");
              else finish();
            })
          }
        />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get("name") ?? "");
        startTransition(async () => {
          const result = await updateProfile({ name });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          finish();
        });
      }}
    >
      <FormMessage message={error} />
      <p className="text-sm text-muted-foreground">স্বাগতম! আপনার নামটি লিখুন।</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">আপনার নাম</Label>
        <Input id="name" name="name" autoComplete="name" minLength={2} maxLength={60} required />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "সংরক্ষণ হচ্ছে…" : "চালিয়ে যান"}
      </Button>
    </form>
  );
}
