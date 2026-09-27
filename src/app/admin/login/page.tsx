import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { checkAdmin, getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "অ্যাডমিন লগইন",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const check = checkAdmin(await getSession());
  if (check.ok) redirect("/admin");
  if (!check.ok && check.reason === "no_2fa") redirect("/admin/setup-2fa");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">অ্যাডমিন লগইন</h1>
          </CardTitle>
          <CardDescription>শুধু আমার বগুড়ার টিমের জন্য।</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
