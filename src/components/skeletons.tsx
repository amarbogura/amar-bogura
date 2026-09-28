"use client";

import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Neutral pulse block. Decorative: screen readers get the status text of the parent skeleton. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <SkeletonBlock className="size-11 rounded-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Full-page placeholder used by loading.tsx files. */
export function PageSkeleton({ label }: { label?: string }) {
  const t = useT();
  return (
    <div role="status" className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <span className="sr-only">{label ?? t("common.loading")}</span>
      <SkeletonBlock className="h-8 w-2/3" />
      <SkeletonBlock className="h-40 w-full rounded-xl" />
      <SkeletonBlock className="h-40 w-full rounded-xl" />
    </div>
  );
}
