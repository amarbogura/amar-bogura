import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { MediaPurpose } from "@/generated/prisma/enums";

import type { Uploader } from "./config";

export class MediaClaimError extends Error {
  constructor(public readonly reason: "too_many" | "not_claimable") {
    super(reason === "too_many" ? "Too many images" : "Media is not claimable by this owner");
  }
}

/**
 * Attaches TEMP media to a request/listing inside the caller's transaction (P7/P9/P12). Every id
 * must be TEMP, of `purpose` and owned by `owner` — otherwise nothing is attached. Returns the
 * publicIds; after the transaction commits the caller must call `removeTempTag(publicIds)` so the
 * cleanup cron keeps them.
 */
export async function claimMedia(
  tx: Pick<Prisma.TransactionClient, "mediaAsset">,
  {
    ids,
    owner,
    purpose,
    max,
  }: { ids: string[]; owner: Uploader; purpose: MediaPurpose; max: number },
): Promise<string[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  if (unique.length > max) throw new MediaClaimError("too_many");

  const ownerFilter =
    owner.kind === "user"
      ? { uploadedById: owner.id }
      : { guestKey: owner.key, uploadedById: null };
  const claimable = await tx.mediaAsset.findMany({
    where: { id: { in: unique }, status: "TEMP", purpose, ...ownerFilter },
    select: { id: true, publicId: true },
  });
  if (claimable.length !== unique.length) throw new MediaClaimError("not_claimable");

  const { count } = await tx.mediaAsset.updateMany({
    where: { id: { in: unique }, status: "TEMP" },
    data: { status: "ATTACHED" },
  });
  // A concurrent claim of the same asset loses the race cleanly.
  if (count !== unique.length) throw new MediaClaimError("not_claimable");
  return claimable.map((media) => media.publicId);
}
