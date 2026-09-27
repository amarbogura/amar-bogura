import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyPhoneForm } from "@/features/auth/components/verify-phone-form";
import { safeNext } from "@/features/auth/safe-next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "মোবাইল নম্বর যাচাই" };

export default async function VerifyPhonePage({
  searchParams,
}: PageProps<"/account/verify-phone">) {
  const next = safeNext((await searchParams).next);
  const { user } = await requireUser("/account/verify-phone");
  if (user.phoneNumber && user.phoneNumberVerified) redirect(next);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold">মোবাইল নম্বর যাচাই করুন</h1>
        </CardTitle>
        <CardDescription>
          রিকোয়েস্ট ও বিজ্ঞাপনের জন্য আমরা আপনার সাথে ফোনে যোগাযোগ করি, তাই একটি যাচাই করা মোবাইল
          নম্বর প্রয়োজন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyPhoneForm next={next} />
      </CardContent>
    </Card>
  );
}
