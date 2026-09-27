"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/components/form-message";
import { authClient, authErrorMessage } from "@/lib/auth-client";

/** D-02: a phone user may link Google later (explicit linking only — implicit linking is off). */
export function LinkedAccounts({ googleLinked }: { googleLinked: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (googleLinked) {
    return <p className="text-sm text-muted-foreground">Google অ্যাকাউন্ট যুক্ত আছে।</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Google যুক্ত করলে পরে Google দিয়েও এই অ্যাকাউন্টে লগইন করতে পারবেন।
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const { error: linkError } = await authClient.linkSocial({
            provider: "google",
            callbackURL: "/account?linked=google",
          });
          if (linkError) {
            setError(authErrorMessage(linkError));
            setPending(false);
          }
        }}
      >
        {pending ? "Google-এ যাচ্ছে…" : "Google অ্যাকাউন্ট যুক্ত করুন"}
      </Button>
      <FormMessage message={error} />
    </div>
  );
}
