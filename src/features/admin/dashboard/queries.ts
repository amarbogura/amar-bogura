import "server-only";

import { db } from "@/lib/db";
import { dhakaYmd, startOfDhakaDay } from "@/lib/time";

import { OPEN_STATUSES } from "../requests/transitions";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardCounts(now = new Date()) {
  const today = startOfDhakaDay(now);
  const [newToday, openRequests, pendingListings, activeServices, users] = await Promise.all([
    db.serviceRequest.count({ where: { createdAt: { gte: today }, isSpam: false } }),
    db.serviceRequest.count({ where: { status: { in: [...OPEN_STATUSES] }, isSpam: false } }),
    db.listing.count({ where: { status: "PENDING" } }),
    db.service.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { role: "user" } }),
  ]);
  return { newToday, openRequests, pendingListings, activeServices, users };
}

/** Open EMERGENCY requests — pinned on top of the overview (oldest first: waiting longest). */
export async function getOpenEmergencies() {
  return db.serviceRequest.findMany({
    where: { priority: "EMERGENCY", status: { in: [...OPEN_STATUSES] }, isSpam: false },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: {
      code: true,
      status: true,
      contactName: true,
      contactPhone: true,
      createdAt: true,
      service: { select: { nameBn: true, nameEn: true } },
    },
  });
}

export async function getLatestNew(limit = 5) {
  return db.serviceRequest.findMany({
    where: { status: "NEW", isSpam: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      code: true,
      title: true,
      contactName: true,
      createdAt: true,
      priority: true,
      service: { select: { nameBn: true, nameEn: true } },
    },
  });
}

/** Requests per Dhaka day for the last `days` days (oldest first), zero-filled. */
export async function requestsPerDay(days = 7, now = new Date()) {
  const start = new Date(startOfDhakaDay(now).getTime() - (days - 1) * DAY_MS);
  const rows = await db.serviceRequest.findMany({
    where: { createdAt: { gte: start }, isSpam: false },
    select: { createdAt: true },
  });
  const key = (date: Date) => {
    const { year, month, day } = dhakaYmd(date);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const buckets = new Map<string, number>();
  for (let index = 0; index < days; index++) {
    buckets.set(key(new Date(start.getTime() + index * DAY_MS + 12 * 60 * 60 * 1000)), 0);
  }
  for (const row of rows) {
    const day = key(row.createdAt);
    if (buckets.has(day)) buckets.set(day, buckets.get(day)! + 1);
  }
  return [...buckets].map(([day, count]) => ({ day, count }));
}
