import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/features/auth/components/form-message";
import { GoogleButton } from "@/features/auth/components/google-button";
import { PhoneLoginForm } from "@/features/auth/components/phone-login-form";
import { safeNext } from "@/features/auth/safe-next";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "লগইন",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold">লগইন করুন</h1>
          </CardTitle>
          <CardDescription>ফোন নম্বরে কোড পাঠিয়ে লগইন — কোনো পাসওয়ার্ড লাগবে না।</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {params.error === "google" && (
            <FormMessage message="Google দিয়ে লগইন করা যায়নি। আবার চেষ্টা করুন বা ফোন নম্বর ব্যবহার করুন।" />
          )}
          <PhoneLoginForm next={next} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            অথবা
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton next={next} />
          <p className="text-xs text-muted-foreground">
            রিকোয়েস্ট করতে লগইন লাগে না — তবে লগইন করলে আপনার রিকোয়েস্টের অবস্থা সহজে দেখতে
            পারবেন।
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
