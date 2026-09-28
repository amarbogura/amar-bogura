import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { getAreaGroups } from "@/features/account/queries";
import { normalizeRequestCode } from "@/features/requests/code";
import { RequestDetail } from "@/features/requests/components/request-detail";
import { getTrackedRequest } from "@/features/requests/queries";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "রিকোয়েস্টের অবস্থা",
  robots: { index: false, follow: false },
};

async function Tracked({ params }: { params: PageProps<"/track/[code]">["params"] }) {
  const raw = decodeURIComponent((await params).code);
  const code = normalizeRequestCode(raw);
  const request = code ? await getTrackedRequest(code) : null;
  // No valid OTP cookie for this code → verify first (the form keeps the code).
  if (!request) redirect(`${routes.track}?code=${encodeURIComponent(code ?? raw)}`);
  return <RequestDetail request={request} areaGroups={await getAreaGroups()} />;
}

export default function TrackedRequestPage({ params }: PageProps<"/track/[code]">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Tracked params={params} />
      </Suspense>
    </div>
  );
}
