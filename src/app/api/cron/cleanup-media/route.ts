import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/env";
import { destroyImages, listTempImagesBefore } from "@/features/media/cloudinary";
import { environmentPrefix } from "@/features/media/config";
import { db } from "@/lib/db";

const DEFAULT_MAX_AGE_HOURS = 24;

function authorized(request: Request): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily Vercel Cron (vercel.json): deletes uploads that were never attached — Cloudinary images
 * still tagged `temp` (including ones never registered) and TEMP MediaAsset rows — after 24 h.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Test hook: shorter age outside production only.
  // (Only when the parameter is actually present — Number(null) is 0, which would delete everything.)
  const raw = new URL(request.url).searchParams.get("maxAgeHours");
  const requested = raw === null || raw.trim() === "" ? Number.NaN : Number(raw);
  const maxAgeHours =
    env.NODE_ENV !== "production" && Number.isFinite(requested) && requested >= 0
      ? requested
      : DEFAULT_MAX_AGE_HOURS;
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const candidates = await listTempImagesBefore(cutoff, environmentPrefix(env.NODE_ENV));
  // Safety net: never delete something the DB says is attached (e.g. tag removal failed).
  const attached = new Set(
    (
      await db.mediaAsset.findMany({
        where: { publicId: { in: candidates }, status: "ATTACHED" },
        select: { publicId: true },
      })
    ).map((media) => media.publicId),
  );
  const toDelete = candidates.filter((publicId) => !attached.has(publicId));
  await destroyImages(toDelete);

  const { count: rowsDeleted } = await db.mediaAsset.deleteMany({
    where: {
      status: "TEMP",
      createdAt: { lt: cutoff },
      publicId: { startsWith: environmentPrefix(env.NODE_ENV) },
    },
  });

  return NextResponse.json(
    {
      cloudinaryDeleted: toDelete.length,
      skippedAttached: attached.size,
      rowsDeleted,
      maxAgeHours,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
