import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Session guard runs inside Suspense (Cache Components: request data can't block the shell). */
async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return children;
}

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <AccountGate>{children}</AccountGate>
      </Suspense>
    </div>
  );
}
