"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span
        className="rounded-xl bg-muted px-4 py-2 font-mono text-2xl font-bold tracking-wide"
        data-testid="request-code"
      >
        {code}
      </span>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "কপি হয়েছে" : "কপি করুন"}
      </Button>
    </div>
  );
}
