import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAreaGroups } from "@/features/account/queries";
import { normalizeRequestCode } from "@/features/requests/code";
import { RequestDetail } from "@/features/requests/components/request-detail";
import { getMyRequest } from "@/features/requests/queries";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "রিকোয়েস্টের বিস্তারিত" };

export default async function MyRequestPage({ params }: PageProps<"/account/requests/[code]">) {
  const raw = decodeURIComponent((await params).code);
  const { user } = await requireUser(routes.myRequest(raw));
  const code = normalizeRequestCode(raw);
  // Owner-scoped query: someone else's code is indistinguishable from a missing one.
  const request = code ? await getMyRequest(user.id, code) : null;
  if (!request) notFound();

  return (
    <>
      <Link href={routes.myRequests} className="text-sm text-primary underline">
        ← আমার রিকোয়েস্ট
      </Link>
      <RequestDetail request={request} areaGroups={await getAreaGroups()} />
    </>
  );
}
