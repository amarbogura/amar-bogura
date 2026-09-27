"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient, authErrorMessage } from "@/lib/auth-client";

import { FormMessage } from "./form-message";
import { OtpStep } from "./otp-step";
import { PhoneStep } from "./phone-step";

/**
 * D-02: Google users add and OTP-verify a phone (one verified phone per user). Verifying with
 * `updatePhoneNumber` attaches the phone to the current session's user and links guest requests.
 */
export function VerifyPhoneForm({ next }: { next: string }) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, startTransition] = useTransition();

  const sendOtp = async (e164: string) => {
    const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: e164 });
    if (sendError) {
      setError(authErrorMessage(sendError));
      return false;
    }
    setError(null);
    return true;
  };

  if (conflict) {
    return (
      <div className="flex flex-col gap-3">
        <FormMessage message="এই নম্বরে আগে থেকেই একটি অ্যাকাউন্ট আছে। একটি নম্বর একটি অ্যাকাউন্টেই যুক্ত থাকতে পারে।" />
        <p className="text-sm text-muted-foreground">
          ওই নম্বর দিয়ে লগইন করুন, তারপর প্রোফাইল থেকে Google অ্যাকাউন্ট যুক্ত করে নিন।
        </p>
        <Link
          href="/login"
          className="inline-flex tap items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
          onClick={() => void authClient.signOut()}
        >
          ফোন নম্বর দিয়ে লগইন করুন
        </Link>
      </div>
    );
  }

  if (!phoneNumber) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage message={error} />
        <PhoneStep
          pending={pending}
          onSubmit={(e164) =>
            startTransition(async () => {
              if (await sendOtp(e164)) setPhoneNumber(e164);
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormMessage message={error} />
      <OtpStep
        phoneNumber={phoneNumber}
        pending={pending}
        onResend={() => sendOtp(phoneNumber)}
        onChangeNumber={() => {
          setError(null);
          setPhoneNumber(null);
        }}
        onVerify={(code) =>
          startTransition(async () => {
            const { error: verifyError } = await authClient.phoneNumber.verify({
              phoneNumber,
              code,
              updatePhoneNumber: true,
            });
            if (verifyError) {
              if (verifyError.code === "PHONE_NUMBER_EXIST") setConflict(true);
              else setError(authErrorMessage(verifyError));
              return;
            }
            router.replace(next);
            router.refresh();
          })
        }
      />
    </div>
  );
}
