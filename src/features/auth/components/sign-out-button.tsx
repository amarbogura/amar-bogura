"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace(redirectTo);
        router.refresh();
      }}
    >
      {pending ? "লগআউট হচ্ছে…" : "লগআউট"}
    </Button>
  );
}
