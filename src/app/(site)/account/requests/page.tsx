import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getMyRequests } from "@/features/requests/queries";
import {
  parseRequestFilter,
  REQUEST_FILTERS,
  type RequestFilter,
} from "@/features/requests/status";
import { relativeTimeBn } from "@/lib/contact-links";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "আমার রিকোয়েস্ট" };

export default async function MyRequestsPage({ searchParams }: PageProps<"/account/requests">) {
  const { user } = await requireUser(routes.myRequests);
  const filter = parseRequestFilter((await searchParams).status);
  const requests = await getMyRequests(user.id, filter);

  return (
    <>
      <h1 className="text-2xl font-bold">আমার রিকোয়েস্ট</h1>
      <nav aria-label="স্ট্যাটাস অনুযায়ী দেখুন" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {(Object.keys(REQUEST_FILTERS) as RequestFilter[]).map((key) => (
            <li key={key}>
              <Link
                href={key === "all" ? routes.myRequests : `${routes.myRequests}?status=${key}`}
                aria-current={filter === key ? "page" : undefined}
                className={cn(
                  "inline-flex tap items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap",
                  filter === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {REQUEST_FILTERS[key].label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {requests.length === 0 ? (
        <EmptyState
          icon="clipboard-list"
          title={filter === "all" ? "এখনো কোনো রিকোয়েস্ট নেই" : "এই তালিকায় কিছু নেই"}
          description="যেকোনো সার্ভিস খুঁজে রিকোয়েস্ট দিন — আমাদের টিম আপনাকে ফোন করবে।"
          action={{ href: routes.home, label: "সার্ভিস দেখুন" }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.code}>
              <Link
                href={routes.myRequest(request.code)}
                className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{request.titleBn}</span>
                  <StatusBadge kind="request" status={request.status} />
                </div>
                {request.summary && <span className="text-sm">{request.summary}</span>}
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">{request.code}</span> ·{" "}
                  {relativeTimeBn(request.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
