import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TwoFactorSetup } from "@/features/auth/components/two-factor-setup";
import { checkAdmin, getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "দুই ধাপের যাচাই চালু করুন",
  robots: { index: false, follow: false },
};

/** Reachable only by an admin-role session that has not enrolled 2FA yet. */
export default async function SetupTwoFactorPage() {
  const check = checkAdmin(await getSession());
  if (check.ok) redirect("/admin");
  if (check.reason === "no_session") redirect("/admin/login");
  if (check.reason !== "no_2fa") redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">দুই ধাপের যাচাই (2FA)</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup />
        </CardContent>
      </Card>
    </main>
  );
}
