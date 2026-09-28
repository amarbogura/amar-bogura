import "server-only";

import { cookies } from "next/headers";

import { env } from "@/env";
import { summarize } from "@/features/forms/summarize";
import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { getT } from "@/i18n/server";
import type { FormSchema } from "@/features/forms/types";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { dhakaYmd } from "@/lib/time";

import { REQUEST_FILTERS, type RequestFilter } from "./status";
import { TRACK_COOKIE, verifyTrackToken } from "./track-token";

const detailSelect = {
  id: true,
  code: true,
  type: true,
  status: true,
  priority: true,
  isGuest: true,
  userId: true,
  title: true,
  contactName: true,
  contactPhone: true,
  altPhone: true,
  areaId: true,
  addressLine: true,
  preferredDate: true,
  preferredTimeSlot: true,
  notes: true,
  details: true,
  quotedAmount: true,
  createdAt: true,
  service: { select: { slug: true, nameBn: true, nameEn: true } },
  formVersion: { select: { schema: true } },
  attachments: { select: { fieldKey: true, media: { select: { id: true, url: true } } } },
  // Only what the customer may see (internal notes stay admin-only).
  events: {
    where: { visibleToUser: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, toStatus: true, message: true, createdAt: true },
  },
} satisfies Prisma.ServiceRequestSelect;

type DetailRow = Prisma.ServiceRequestGetPayload<{ select: typeof detailSelect }>;

export type RequestDetailData = Omit<DetailRow, "formVersion" | "details" | "userId"> & {
  schema: FormSchema | null;
  details: Record<string, unknown>;
  /** Common columns keyed like the form's common fields (for DetailsView extraValues). */
  commonValues: Record<string, unknown>;
};

const pad = (value: number) => String(value).padStart(2, "0");

function toDetail(row: DetailRow): RequestDetailData {
  const { formVersion, details, userId: _userId, ...rest } = row;
  let preferredDate: string | undefined;
  if (row.preferredDate) {
    const { year, month, day } = dhakaYmd(row.preferredDate);
    preferredDate = `${year}-${pad(month)}-${pad(day)}`;
  }
  const commonValues: Record<string, unknown> = {
    title: row.title ?? undefined,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    altPhone: row.altPhone ?? undefined,
    areaId: row.areaId ?? undefined,
    addressLine: row.addressLine ?? undefined,
    preferredDate,
    preferredTimeSlot: row.preferredTimeSlot ?? undefined,
    notes: row.notes ?? undefined,
  };
  return {
    ...rest,
    schema: (formVersion?.schema as FormSchema | undefined) ?? null,
    details: (details ?? {}) as Record<string, unknown>,
    commonValues,
  };
}

/** One request, only if `userId` owns it — another user's code is simply "not found" (IDOR). */
export async function getMyRequest(
  userId: string,
  code: string,
): Promise<RequestDetailData | null> {
  const row = await db.serviceRequest.findFirst({ where: { code, userId }, select: detailSelect });
  return row ? toDetail(row) : null;
}

/** The request the `/track` cookie grants (after OTP), if it matches `code`. */
export async function getTrackedRequest(code: string): Promise<RequestDetailData | null> {
  const requestId = verifyTrackToken(
    (await cookies()).get(TRACK_COOKIE)?.value,
    env.BETTER_AUTH_SECRET,
  );
  if (!requestId) return null;
  const row = await db.serviceRequest.findFirst({
    where: { id: requestId, code },
    select: detailSelect,
  });
  return row ? toDetail(row) : null;
}

export interface MyRequestListItem {
  code: string;
  status: DetailRow["status"];
  priority: DetailRow["priority"];
  title: string;
  summary: string;
  createdAt: Date;
}

export async function getMyRequests(
  userId: string,
  filter: RequestFilter,
  locale: Locale,
): Promise<MyRequestListItem[]> {
  const t = getT(locale);
  const statuses = REQUEST_FILTERS[filter].statuses;
  const rows = await db.serviceRequest.findMany({
    where: { userId, ...(statuses ? { status: { in: [...statuses] } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      code: true,
      status: true,
      priority: true,
      type: true,
      title: true,
      details: true,
      createdAt: true,
      service: { select: { nameBn: true, nameEn: true } },
      formVersion: { select: { schema: true } },
    },
  });
  return rows.map((row) => ({
    code: row.code,
    status: row.status,
    priority: row.priority,
    title: row.service
      ? pick(row.service, "name", locale)
      : (row.title ?? t("requests.custom.title")),
    summary: row.formVersion
      ? summarize(
          row.formVersion.schema as unknown as FormSchema,
          (row.details ?? {}) as Record<string, unknown>,
          { locale },
        )
      : "",
    createdAt: row.createdAt,
  }));
}
