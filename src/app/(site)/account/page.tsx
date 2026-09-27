import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedAccounts } from "@/features/account/components/linked-accounts";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getAreaGroups, getLinkedProviders, getUserAreaId } from "@/features/account/queries";
import { FormMessage } from "@/features/auth/components/form-message";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { isTempName } from "@/lib/auth-policy";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "আমার প্রোফাইল" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { user } = await requireUser("/account");
  const [areaGroups, providers, areaId, params] = await Promise.all([
    getAreaGroups(),
    getLinkedProviders(user.id),
    getUserAreaId(user.id),
    searchParams,
  ]);
  const phoneVerified = !!user.phoneNumber && user.phoneNumberVerified;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">আমার প্রোফাইল</h1>
        <SignOutButton />
      </div>

      {params.linked === "google" && (
        <FormMessage tone="info" message="Google অ্যাকাউন্ট যুক্ত হয়েছে।" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">মোবাইল নম্বর</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {phoneVerified ? (
            <p className="text-lg font-medium">
              {formatBdPhoneDisplay(user.phoneNumber!)}{" "}
              <span className="text-sm font-normal text-primary">✓ যাচাই করা</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                রিকোয়েস্ট বা বিজ্ঞাপন দিতে মোবাইল নম্বর যাচাই করা প্রয়োজন।
              </p>
              <Link
                href="/account/verify-phone"
                className="inline-flex tap items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground"
              >
                মোবাইল নম্বর যাচাই করুন
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">ব্যক্তিগত তথ্য</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={isTempName(user.name, user.phoneNumber) ? "" : user.name}
            areaId={areaId}
            areaGroups={areaGroups}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">লগইনের মাধ্যম</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedAccounts googleLinked={providers.includes("google")} />
        </CardContent>
      </Card>
    </>
  );
}
