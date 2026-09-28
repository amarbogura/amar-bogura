"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/components/form-message";

import { cancelRequest } from "../actions";

export function CancelRequestButton({ code }: { code: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="outline" size="lg" onClick={() => setConfirming(true)}>
        রিকোয়েস্ট বাতিল করুন
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-3" role="group">
      <p className="font-medium">রিকোয়েস্টটি বাতিল করতে চান? এটি আর ফেরানো যাবে না।</p>
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
          {pending ? "বাতিল হচ্ছে…" : "হ্যাঁ, বাতিল করুন"}
        </Button>
        <Button variant="ghost" size="lg" disabled={pending} onClick={() => setConfirming(false)}>
          না, থাক
        </Button>
      </div>
    </div>
  );
}
