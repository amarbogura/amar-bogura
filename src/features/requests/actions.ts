"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";

import { env } from "@/env";
import { buildRequestFormSchema, type RequestFormValues } from "@/features/forms/build-zod";
import { allFields } from "@/features/forms/schema-utils";
import { COMMON_PHOTOS_MAX, IMAGES_MAX_FILES } from "@/features/forms/types";
import type { Uploader } from "@/features/media/config";
import { claimMedia, MediaClaimError } from "@/features/media/claim";
import { removeTempTag } from "@/features/media/cloudinary";
import { currentGuestKey } from "@/features/media/uploader";
import { type ActionError, fail } from "@/lib/action";
import { db } from "@/lib/db";
import { bdPhoneSchema } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request-ip";
import { getSession } from "@/lib/session";
import { getSmsProvider } from "@/lib/sms";
import { toBanglaDigits } from "@/lib/bangla";

import { findDuplicateRequest, isBlockedPhone } from "./anti-spam";
import { HONEYPOT_FIELD } from "./honeypot";
import { nextRequestCode, normalizeRequestCode, withCodeRetry } from "./code";
import {
  type RequestFormContext,
  resolveCustomRequestForm,
  resolveServiceRequestForm,
} from "./resolve-form";
import { CANCELLABLE, requestPriority } from "./status";
import { checkTrackOtp, issueTrackOtp } from "./track-otp";
import { signTrackToken, TRACK_COOKIE, TRACK_TTL_SECONDS, verifyTrackToken } from "./track-token";
import { verifyTurnstile } from "./turnstile";

// ───────── submitServiceRequest (docs/03 §3.3) ─────────

const submitInput = z.object({
  target: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("service"), slug: z.string().min(1).max(100) }),
    z.object({ kind: z.literal("custom") }),
  ]),
  payload: z.object({ common: z.unknown(), details: z.unknown() }),
  turnstileToken: z.string().max(2048).optional(),
  [HONEYPOT_FIELD]: z.string().max(500).optional(),
});

export type SubmitRequestInput = z.input<typeof submitInput>;
export type SubmitRequestResult =
  | { ok: true; code: string; duplicate: boolean }
  | (ActionError & { fieldErrors?: Record<string, string>; needPhone?: boolean });

const MESSAGES = {
  guestNotAllowed: "এই সার্ভিসের রিকোয়েস্ট দিতে অনুগ্রহ করে লগইন করুন।",
  needPhone: "রিকোয়েস্ট দেওয়ার আগে আপনার মোবাইল নম্বর যাচাই করুন।",
  captcha: "নিরাপত্তা যাচাই সম্পন্ন হয়নি। একটু অপেক্ষা করে আবার চেষ্টা করুন।",
  invalid: "কিছু তথ্য ঠিক নেই। লাল চিহ্নিত ঘরগুলো দেখুন।",
  blocked: "এই নম্বর থেকে অনলাইনে রিকোয়েস্ট নেওয়া যাচ্ছে না। অনুগ্রহ করে হটলাইনে কল করুন।",
  media: "ছবিগুলো আর পাওয়া যাচ্ছে না। ছবি সরিয়ে আবার যোগ করুন।",
} as const;

async function loadForm(target: z.output<typeof submitInput>["target"]) {
  return target.kind === "custom"
    ? resolveCustomRequestForm()
    : resolveServiceRequestForm(target.slug);
}

/** `{ fieldKey → ids }` for every image field the validated payload contains. */
function mediaByField(form: RequestFormContext, data: RequestFormValues) {
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

/**
 * Creates a ServiceRequest from a DynamicForm submission. Guests (D-03) and users share one path;
 * the order is: honeypot → who → rate limit → form → Zod (server mode) → blocklist → duplicate →
 * transaction (code, request, CREATED event, media claim).
 */
export async function submitServiceRequest(
  input: SubmitRequestInput,
): Promise<SubmitRequestResult> {
  const parsedInput = submitInput.safeParse(input);
  if (!parsedInput.success) return fail(400);
  const { target, payload, turnstileToken } = parsedInput.data;
  // Bots fill every input; a person never sees this one. No hint about why it failed.
  if (parsedInput.data[HONEYPOT_FIELD]) return fail(400);

  const form = await loadForm(target);
  if (!form) return fail(404);

  const session = await getSession();
  const ip = getClientIp(await headers());
  const ipHash = hashIp(ip, env.BETTER_AUTH_SECRET);
  const adminTags: string[] = [];

  if (session) {
    if (!session.user.phoneNumber || !session.user.phoneNumberVerified) {
      return { ...fail(403, MESSAGES.needPhone), needPhone: true };
    }
    const limited = form.isEmergency
      ? await rateLimit("requestEmergencyIp", ip)
      : await rateLimit("requestUser", session.user.id);
    if (!limited.success) return fail(429);
  } else {
    if (!form.allowGuest) return fail(401, MESSAGES.guestNotAllowed);
    const limited = await rateLimit(form.isEmergency ? "requestEmergencyIp" : "requestGuestIp", ip);
    if (!limited.success) return fail(429);
    const captcha = await verifyTurnstile(turnstileToken, ip);
    if (captcha !== "ok") {
      // Never block an ambulance request on a captcha; flag it for the operator instead.
      if (!form.isEmergency) return fail(400, MESSAGES.captcha);
      adminTags.push(`turnstile-${captcha}`);
    }
  }

  const now = new Date();
  const result = buildRequestFormSchema(form.schema, {
    mode: "server",
    presets: form.presets,
    now,
  }).safeParse(payload);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] ??= issue.message;
    }
    return { ...fail(400, MESSAGES.invalid), fieldErrors };
  }
  const data = result.data as RequestFormValues;
  const common = data.common;
  const contactPhone = common.contactPhone as string;

  if (!session && !form.isEmergency) {
    if (!(await rateLimit("requestGuestPhone", contactPhone)).success) return fail(429);
  }
  if (await isBlockedPhone(contactPhone)) return fail(403, MESSAGES.blocked);

  const duplicate = await findDuplicateRequest(
    { phone: contactPhone, type: form.type, serviceId: form.serviceId },
    now,
  );
  if (duplicate) return { ok: true, code: duplicate, duplicate: true };

  let owner: Uploader | null = session ? { kind: "user", id: session.user.id } : null;
  const media = mediaByField(form, data);
  if (!owner && media.length) {
    const key = await currentGuestKey();
    if (!key) return fail(400, MESSAGES.media);
    owner = { kind: "guest", key };
  }

  let created: { code: string; publicIds: string[] };
  try {
    created = await withCodeRetry(() =>
      db.$transaction(async (tx) => {
        const code = await nextRequestCode(tx, now);
        const request = await tx.serviceRequest.create({
          data: {
            code,
            type: form.type,
            priority: requestPriority(form.isEmergency, data.details),
            userId: session?.user.id ?? null,
            isGuest: !session,
            serviceId: form.serviceId,
            categoryId: form.categoryId,
            formVersionId: form.formVersionId,
            title: optionalText(common.title),
            contactName: common.contactName as string,
            contactPhone,
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
            ipHash,
            adminTags,
            events: {
              create: {
                type: "CREATED",
                toStatus: "NEW",
                visibleToUser: true,
                actorId: session?.user.id,
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
              owner: owner!,
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
        return { code, publicIds };
      }),
    );
  } catch (error) {
    if (error instanceof MediaClaimError) return fail(400, MESSAGES.media);
    throw error;
  }

  // Keep attached images out of the TEMP cleanup; if this fails the cron re-checks the DB status.
  if (created.publicIds.length) {
    await removeTempTag(created.publicIds).catch((error: unknown) =>
      console.error("[requests] removeTempTag failed", error),
    );
  }
  return { ok: true, code: created.code, duplicate: false };
}

// ───────── cancel ─────────

async function trackedRequestId(): Promise<string | null> {
  return verifyTrackToken((await cookies()).get(TRACK_COOKIE)?.value, env.BETTER_AUTH_SECRET);
}

/** Owner (logged in) or a verified `/track` browser may cancel while NEW / REVIEWING. */
export async function cancelRequest(input: { code: string }): Promise<{ ok: true } | ActionError> {
  const code = normalizeRequestCode(String(input?.code ?? ""));
  if (!code) return fail(404);

  const session = await getSession();
  const ip = getClientIp(await headers());
  if (!(await rateLimit("requestCancel", session?.user.id ?? ip)).success) return fail(429);

  const request = await db.serviceRequest.findUnique({
    where: { code },
    select: { id: true, userId: true, status: true },
  });
  const allowed =
    !!request &&
    ((!!session && request.userId === session.user.id) ||
      (await trackedRequestId()) === request.id);
  // Same answer for "not yours" and "doesn't exist" (no code enumeration).
  if (!request || !allowed) return fail(404);
  if (!CANCELLABLE.includes(request.status)) {
    return fail(409, "কাজ শুরু হয়ে যাওয়ায় এখন আর বাতিল করা যাবে না। হটলাইনে যোগাযোগ করুন।");
  }

  const cancelled = await db.$transaction(async (tx) => {
    // Status guard in the WHERE: an admin moving it forward at the same moment wins.
    const { count } = await tx.serviceRequest.updateMany({
      where: { id: request.id, status: { in: [...CANCELLABLE] } },
      data: { status: "CANCELLED", closedAt: new Date() },
    });
    if (count === 0) return false;
    await tx.requestEvent.create({
      data: {
        requestId: request.id,
        type: "STATUS_CHANGE",
        fromStatus: request.status,
        toStatus: "CANCELLED",
        message: "গ্রাহক রিকোয়েস্টটি বাতিল করেছেন।",
        visibleToUser: true,
        actorId: session?.user.id,
      },
    });
    return true;
  });
  return cancelled ? { ok: true } : fail(409, "স্ট্যাটাস বদলে গেছে। পেজটি রিফ্রেশ করুন।");
}

// ───────── /track: code + phone → OTP → cookie ─────────

const trackInput = z.object({
  code: z
    .string()
    .max(40)
    .transform((value, ctx) => {
      const code = normalizeRequestCode(value);
      if (!code) {
        ctx.addIssue({
          code: "custom",
          message: "রিকোয়েস্ট কোডটি সঠিক নয় (যেমন: AB-260928-0012)।",
        });
        return z.NEVER;
      }
      return code;
    }),
  phone: bdPhoneSchema,
});

async function findTrackable(code: string, phone: string) {
  return db.serviceRequest.findFirst({
    where: { code, contactPhone: phone },
    select: { id: true },
  });
}

/**
 * Sends a code to the request's phone. The answer is identical whether or not the code/phone pair
 * exists, so the form can't be used to discover requests.
 */
export async function sendTrackOtp(input: {
  code: string;
  phone: string;
}): Promise<{ ok: true } | ActionError> {
  const parsed = trackInput.safeParse(input);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message);
  const { code, phone } = parsed.data;

  const ip = getClientIp(await headers());
  if (!(await rateLimit("trackOtpIp", ip)).success) return fail(429);
  if (!(await rateLimit("trackOtpPhone", phone)).success) return fail(429);

  const request = await findTrackable(code, phone);
  if (request) {
    const otp = await issueTrackOtp(request.id);
    await getSmsProvider().send({
      to: phone,
      text: `আমার বগুড়া: রিকোয়েস্ট ${code} দেখার কোড ${toBanglaDigits(otp)}। ৫ মিনিটের মধ্যে ব্যবহার করুন।`,
    });
  }
  return { ok: true };
}

export async function verifyTrackOtp(input: {
  code: string;
  phone: string;
  otp: string;
}): Promise<{ ok: true; code: string } | ActionError> {
  const parsed = trackInput.extend({ otp: z.string().regex(/^\d{6}$/) }).safeParse(input);
  if (!parsed.success) return fail(400, "৬ অঙ্কের কোডটি দিন।");
  const { code, phone, otp } = parsed.data;

  const ip = getClientIp(await headers());
  if (!(await rateLimit("trackVerifyIp", ip)).success) return fail(429);

  const request = await findTrackable(code, phone);
  const check = request ? await checkTrackOtp(request.id, otp) : "invalid";
  if (check === "expired") return fail(400, "কোডের মেয়াদ শেষ। নতুন কোড নিন।");
  if (check !== "ok" || !request) return fail(400, "কোডটি সঠিক নয়।");

  (await cookies()).set(TRACK_COOKIE, signTrackToken(request.id, env.BETTER_AUTH_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: TRACK_TTL_SECONDS,
  });
  return { ok: true, code };
}
