import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { TrackForm } from "@/features/requests/components/track-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "রিকোয়েস্ট ট্র্যাক করুন",
  description: "রিকোয়েস্ট কোড ও মোবাইল নম্বর দিয়ে আপনার রিকোয়েস্টের অবস্থা দেখুন — লগইন ছাড়াই।",
  alternates: { canonical: routes.track },
};

async function TrackFormWithCode({
  searchParams,
}: {
  searchParams: PageProps<"/track">["searchParams"];
}) {
  const { code } = await searchParams;
  return <TrackForm initialCode={typeof code === "string" ? code : ""} />;
}

/** D-03: guests track with request code + OTP to the request phone. */
export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">রিকোয়েস্ট ট্র্যাক করুন</h1>
        <p className="text-sm text-muted-foreground">
          রিকোয়েস্টের কোড ও যে নম্বর দিয়েছিলেন তা দিন। নম্বরে একটি কোড যাবে।
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <TrackFormWithCode searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        একই নম্বর দিয়ে{" "}
        <Link href={`/login?next=${encodeURIComponent(routes.myRequests)}`} className="underline">
          লগইন করলে
        </Link>{" "}
        সব রিকোয়েস্ট একসাথে দেখতে পাবেন।
      </p>
    </div>
  );
}
