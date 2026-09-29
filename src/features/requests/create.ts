import "server-only";

import type { RequestFormValues } from "@/features/forms/build-zod";
import { allFields } from "@/features/forms/schema-utils";
import { COMMON_PHOTOS_MAX, IMAGES_MAX_FILES } from "@/features/forms/types";
import type { Uploader } from "@/features/media/config";
import { claimMedia } from "@/features/media/claim";
import { removeTempTag } from "@/features/media/cloudinary";
import type { RequestSource } from "@/generated/prisma/enums";
import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";

import { nextRequestCode, withCodeRetry } from "./code";
import type { RequestFormContext } from "./resolve-form";
import { requestPriority } from "./status";

/** `{ fieldKey → ids }` for every image field the validated payload contains. */
export function mediaByField(form: RequestFormContext, data: RequestFormValues) {
  const groups: Array<{ fieldKey: string; ids: string[]; max: number }> = [];
  const photos = data.common.photos;
  if (Array.isArray(photos) && photos.length) {
    groups.push({ fieldKey: "photos", ids: photos as string[], max: COMMON_PHOTOS_MAX });
  }
  for (const field of allFields(form.schema)) {
    const value = data.details[field.key];
    if (field.type === "images" && Array.isArray(value) && value.length) {
      groups.push({
        fieldKey: field.key,
        ids: value as string[],
        max: field.validation?.maxFiles ?? IMAGES_MAX_FILES,
      });
    }
  }
  return groups;
}

const optionalText = (value: unknown) => (typeof value === "string" && value ? value : null);

export interface InsertRequestInput {
  form: RequestFormContext;
  /** Already validated with the form engine in server mode. */
  data: RequestFormValues;
  now: Date;
  userId: string | null;
  isGuest: boolean;
  source: RequestSource;
  locale: Locale;
  ipHash: string | null;
  adminTags: string[];
  /** Who owns the TEMP uploads being attached (required when the payload has images). */
  mediaOwner: Uploader | null;
  /** The CREATED event: actor, customer visibility and an optional note. */
  created: { actorId: string | null; visibleToUser: boolean; message?: string };
}

/**
 * The one place a ServiceRequest is inserted (public submit P7, admin phone request P8): code,
 * row, CREATED event and media claim in one transaction, retried on a code collision. Throws
 * `MediaClaimError` when images aren't claimable by `mediaOwner`.
 */
export async function insertRequest(
  input: InsertRequestInput,
): Promise<{ id: string; code: string }> {
  const { form, data, now } = input;
  const common = data.common;
  const media = mediaByField(form, data);

  const result = await withCodeRetry(() =>
    db.$transaction(async (tx) => {
      const code = await nextRequestCode(tx, now);
      const request = await tx.serviceRequest.create({
        data: {
          code,
          type: form.type,
          priority: requestPriority(form.isEmergency, data.details),
          source: input.source,
          userId: input.userId,
          isGuest: input.isGuest,
          serviceId: form.serviceId,
          categoryId: form.categoryId,
          formVersionId: form.formVersionId,
          title: optionalText(common.title),
          contactName: common.contactName as string,
          contactPhone: common.contactPhone as string,
          altPhone: optionalText(common.altPhone),
          areaId: optionalText(common.areaId),
          addressLine: optionalText(common.addressLine),
          preferredDate:
            typeof common.preferredDate === "string"
              ? new Date(`${common.preferredDate}T00:00:00+06:00`)
              : null,
          preferredTimeSlot: optionalText(common.preferredTimeSlot),
          notes: optionalText(common.notes),
          details: data.details as object,
          ipHash: input.ipHash,
          adminTags: input.adminTags,
          locale: input.locale,
          events: {
            create: {
              type: "CREATED",
              toStatus: "NEW",
              visibleToUser: input.created.visibleToUser,
              actorId: input.created.actorId,
              message: input.created.message,
            },
          },
        },
        select: { id: true },
      });

      const publicIds: string[] = [];
      for (const group of media) {
        publicIds.push(
          ...(await claimMedia(tx, {
            ids: group.ids,
            owner: input.mediaOwner!,
            purpose: "REQUEST",
            max: group.max,
          })),
        );
        await tx.requestAttachment.createMany({
          data: [...new Set(group.ids)].map((mediaId) => ({
            requestId: request.id,
            mediaId,
            fieldKey: group.fieldKey,
          })),
        });
      }
      return { id: request.id, code, publicIds };
    }),
  );

  // Keep attached images out of the TEMP cleanup; if this fails the cron re-checks the DB status.
  if (result.publicIds.length) {
    await removeTempTag(result.publicIds).catch((error: unknown) =>
      console.error("[requests] removeTempTag failed", error),
    );
  }
  return { id: result.id, code: result.code };
}
