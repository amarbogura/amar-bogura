import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ROLE_LABELS_BN } from "@/lib/permissions";
import { requireAdminPage } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "অ্যাডমিন", template: "%s | অ্যাডমিন | আমার বগুড়া" },
  robots: { index: false, follow: false },
};

/** Authoritative guard for the whole admin panel; renders chrome + children only for admins. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b bg-navy px-4 py-3 text-navy-foreground">
        <p className="font-semibold">আমার বগুড়া · অ্যাডমিন</p>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user.name} · {ROLE_LABELS_BN[user.role]}
          </span>
          <SignOutButton redirectTo="/admin/login" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        {children}
      </main>
    </>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<PageSkeleton label="অ্যাডমিন প্যানেল লোড হচ্ছে…" />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}
