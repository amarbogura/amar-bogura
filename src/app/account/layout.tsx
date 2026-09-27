import type { Metadata } from "next";

import { requireUser } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await requireUser("/account");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">{children}</main>
  );
}
