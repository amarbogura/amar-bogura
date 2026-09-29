"use server";

import { z } from "zod";

import { buildRequestFormSchema, type RequestFormValues } from "@/features/forms/build-zod";
import { commonFields } from "@/features/forms/common-fields";
import { formatValue } from "@/features/forms/format-value";
import { tr, valueFields } from "@/features/forms/schema-utils";
import type { FormSchema } from "@/features/forms/types";
import { MediaClaimError } from "@/features/media/claim";
import { insertRequest, mediaByField } from "@/features/requests/create";
import {
  resolveCustomRequestForm,
  resolveServiceRequestForm,
} from "@/features/requests/resolve-form";
import { RequestStatus } from "@/generated/prisma/enums";
import { isLocale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { formatDate, formatDateTime, formatMoney } from "@/i18n/format";
import { getT } from "@/i18n/t";
import { adminAction, fail, ok } from "@/lib/action";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { bdPhoneSchema, formatBdPhoneDisplay } from "@/lib/phone";

import { toCsv } from "./csv";
import { requestFiltersSchema } from "./filters";
import { requestWhere } from "./queries";
import { canTransition, isClosed, requiresMessage } from "./transitions";

const code = z.string().trim().min(1).max(40);
const message = z.string().trim().max(1000);

async function findRequest(requestCode: string) {
  return db.serviceRequest.findUnique({
    where: { code: requestCode },
    select: { id: true, code: true, status: true, locale: true, isSpam: true },
  });
}

// ───────── status ─────────

export const changeStatus = adminAction(
  "requests.manage",
  z.object({ code, to: z.enum(RequestStatus), message: message.optional() }),
  async (input, { session, t, audit }) => {
    const request = await findRequest(input.code);
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    if (!canTransition(request.status, input.to, "admin"))
      return fail(409, t("admin.errors.statusNotAllowed"), t);
    const text = input.message || null;
    if (requiresMessage(input.to, "admin") && !text)
      return fail(400, t("admin.errors.messageRequired"), t);

    const changed = await db.$transaction(async (tx) => {
      // Guarded update: if someone else moved it meanwhile, nothing changes.
      const { count } = await tx.serviceRequest.updateMany({
        where: { id: request.id, status: request.status },
        data: { status: input.to, closedAt: isClosed(input.to) ? new Date() : null },
      });
      if (count === 0) return false;
      await tx.requestEvent.create({
        data: {
          requestId: request.id,
          type: "STATUS_CHANGE",
          fromStatus: request.status,
          toStatus: input.to,
          message: text,
          visibleToUser: true,
          actorId: session.user.id,
        },
      });
      await audit(tx, {
        action: "request.status",
        entityType: "ServiceRequest",
        entityId: request.id,
        before: { status: request.status },
        after: { status: input.to, message: text },
      });
      return true;
    });
    return changed ? ok({ status: input.to }) : fail(409, t("admin.errors.statusChanged"), t);
  },
);

// ───────── notes, assignment, quote, tags, spam ─────────

export const addNote = adminAction(
  "requests.manage",
  z.object({ code, message: message.min(1), visibleToUser: z.boolean() }),
  async (input, { session, t, audit }) => {
    const request = await findRequest(input.code);
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    await db.$transaction(async (tx) => {
      const event = await tx.requestEvent.create({
        data: {
          requestId: request.id,
          type: "NOTE",
          message: input.message,
          visibleToUser: input.visibleToUser,
          actorId: session.user.id,
        },
        select: { id: true },
      });
      await audit(tx, {
        action: "request.note",
        entityType: "ServiceRequest",
        entityId: request.id,
        after: { eventId: event.id, visibleToUser: input.visibleToUser },
      });
    });
    return ok({});
  },
);

export const assignRequest = adminAction(
  "requests.manage",
  z.object({ code, userId: z.string().min(1).max(64).nullable() }),
  async (input, { session, t, audit }) => {
    const request = await db.serviceRequest.findUnique({
      where: { code: input.code },
      select: { id: true, assignedToId: true },
    });
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    let assigneeName: string | null = null;
    if (input.userId) {
      const assignee = await db.user.findUnique({
        where: { id: input.userId },
        select: { name: true, role: true, banned: true },
      });
      if (!assignee || !isAdminRole(assignee.role) || assignee.banned)
        return fail(400, t("admin.errors.notAssignable"), t);
      assigneeName = assignee.name;
    }
    await db.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id: request.id },
        data: { assignedToId: input.userId },
      });
      // Internal: the customer doesn't see who works on it.
      await tx.requestEvent.create({
        data: {
          requestId: request.id,
          type: "ASSIGNMENT",
          message: assigneeName,
          visibleToUser: false,
          actorId: session.user.id,
        },
      });
      await audit(tx, {
        action: "request.assign",
        entityType: "ServiceRequest",
        entityId: request.id,
        before: { assignedToId: request.assignedToId },
        after: { assignedToId: input.userId },
      });
    });
    return ok({});
  },
);

export const setQuote = adminAction(
  "requests.manage",
  z.object({ code, amount: z.number().int().min(0).max(100_000_000) }),
  async (input, { session, t, audit }) => {
    const request = await db.serviceRequest.findUnique({
      where: { code: input.code },
      select: { id: true, quotedAmount: true, locale: true },
    });
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    // The customer reads it in the language they used for the request.
    const customerLocale = isLocale(request.locale) ? request.locale : "bn";
    const text = getT(customerLocale)("admin.request.quoteMessage", {
      amount: formatMoney(input.amount, customerLocale),
    });
    await db.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id: request.id },
        data: { quotedAmount: input.amount },
      });
      await tx.requestEvent.create({
        data: {
          requestId: request.id,
          type: "QUOTE",
          message: text,
          visibleToUser: true,
          actorId: session.user.id,
        },
      });
      await audit(tx, {
        action: "request.quote",
        entityType: "ServiceRequest",
        entityId: request.id,
        before: { quotedAmount: request.quotedAmount },
        after: { quotedAmount: input.amount },
      });
    });
    return ok({});
  },
);

export const setTags = adminAction(
  "requests.manage",
  z.object({ code, tags: z.array(z.string().trim().min(1).max(30)).max(10) }),
  async (input, { t, audit }) => {
    const request = await db.serviceRequest.findUnique({
      where: { code: input.code },
      select: { id: true, adminTags: true },
    });
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    const tags = [...new Set(input.tags.map((tag) => tag.toLowerCase()))];
    await db.$transaction(async (tx) => {
      await tx.serviceRequest.update({ where: { id: request.id }, data: { adminTags: tags } });
      await audit(tx, {
        action: "request.tags",
        entityType: "ServiceRequest",
        entityId: request.id,
        before: { tags: request.adminTags },
        after: { tags },
      });
    });
    return ok({ tags });
  },
);

export const markSpam = adminAction(
  "requests.manage",
  z.object({ code, spam: z.boolean() }),
  async (input, { t, audit }) => {
    const request = await findRequest(input.code);
    if (!request) return fail(404, t("admin.errors.requestNotFound"), t);
    await db.$transaction(async (tx) => {
      await tx.serviceRequest.update({ where: { id: request.id }, data: { isSpam: input.spam } });
      await audit(tx, {
        action: "request.spam",
        entityType: "ServiceRequest",
        entityId: request.id,
        before: { isSpam: request.isSpam },
        after: { isSpam: input.spam },
      });
    });
    return ok({});
  },
);

// ───────── phone blocklist ─────────

export const blockPhone = adminAction(
  "requests.manage",
  z.object({ phone: bdPhoneSchema, reason: z.string().trim().max(200).optional() }),
  async (input, { session, audit }) => {
    await db.$transaction(async (tx) => {
      await tx.blockedPhone.upsert({
        where: { phone: input.phone },
        create: { phone: input.phone, reason: input.reason || null, createdById: session.user.id },
        update: { reason: input.reason || null },
      });
      await audit(tx, {
        action: "phone.block",
        entityType: "BlockedPhone",
        entityId: input.phone,
        after: { reason: input.reason || null },
      });
    });
    return ok({ phone: input.phone });
  },
);

export const unblockPhone = adminAction(
  "requests.manage",
  z.object({ phone: bdPhoneSchema }),
  async (input, { audit }) => {
    await db.$transaction(async (tx) => {
      await tx.blockedPhone.deleteMany({ where: { phone: input.phone } });
      await audit(tx, {
        action: "phone.unblock",
        entityType: "BlockedPhone",
        entityId: input.phone,
      });
    });
    return ok({ phone: input.phone });
  },
);

// ───────── request on behalf of a phone caller ─────────

export const createPhoneRequest = adminAction(
  "requests.manage",
  z.object({
    target: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("service"), slug: z.string().min(1).max(100) }),
      z.object({ kind: z.literal("custom") }),
    ]),
    payload: z.object({ common: z.unknown(), details: z.unknown() }),
  }),
  async (input, { session, t, audit }) => {
    const form =
      input.target.kind === "custom"
        ? await resolveCustomRequestForm()
        : await resolveServiceRequestForm(input.target.slug);
    if (!form) return fail(404, t("admin.errors.requestNotFound"), t);

    const now = new Date();
    // Errors in the operator's language; the admin enters the caller's answers.
    const parsed = buildRequestFormSchema(form.schema, {
      mode: "server",
      presets: form.presets,
      now,
      locale: t.locale,
    }).safeParse(input.payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
      return { ...fail(400, t("requests.errors.invalid"), t), fieldErrors };
    }
    const data = parsed.data as RequestFormValues;
    const phone = data.common.contactPhone as string;
    // A caller who already has an account (verified phone) sees it in "My requests" right away.
    const owner = await db.user.findFirst({
      where: { phoneNumber: phone, phoneNumberVerified: true },
      select: { id: true, locale: true },
    });

    let created: { id: string; code: string };
    try {
      created = await insertRequest({
        form,
        data,
        now,
        userId: owner?.id ?? null,
        isGuest: !owner,
        source: "PHONE",
        locale: owner && isLocale(owner.locale) ? owner.locale : "bn",
        ipHash: null,
        adminTags: [],
        mediaOwner: mediaByField(form, data).length ? { kind: "user", id: session.user.id } : null,
        created: {
          actorId: session.user.id,
          visibleToUser: true,
        },
      });
    } catch (error) {
      if (error instanceof MediaClaimError) return fail(400, t("requests.errors.media"), t);
      throw error;
    }
    await db.$transaction(async (tx) => {
      await tx.requestEvent.create({
        data: {
          requestId: created.id,
          type: "NOTE",
          message: t("admin.request.createdByPhone", { name: session.user.name }),
          visibleToUser: false,
          actorId: session.user.id,
        },
      });
      await audit(tx, {
        action: "request.create_phone",
        entityType: "ServiceRequest",
        entityId: created.id,
        after: { code: created.code, linkedUser: owner?.id ?? null },
      });
    });
    return ok({ code: created.code });
  },
);

// ───────── CSV export ─────────

const EXPORT_LIMIT = 5000;

/** Stored answers → "Label: value; …" using the request's OWN form version. */
function flattenDetails(
  schema: FormSchema | null,
  details: Record<string, unknown>,
  locale: "bn" | "en",
  areaNames: Map<string, string>,
): string {
  if (!schema) return "";
  return valueFields(schema)
    .map((field) => {
      const text = formatValue(field, details[field.key], { locale, areaNames });
      return text ? `${tr(field.label, locale)}: ${text}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

export const exportRequestsCsv = adminAction(
  "requests.manage",
  requestFiltersSchema,
  async (filters, { session, t, audit }) => {
    const locale = t.locale;
    const rows = await db.serviceRequest.findMany({
      where: requestWhere(filters, session.user.id),
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      select: {
        id: true,
        code: true,
        createdAt: true,
        status: true,
        priority: true,
        source: true,
        isGuest: true,
        isSpam: true,
        title: true,
        contactName: true,
        contactPhone: true,
        altPhone: true,
        addressLine: true,
        preferredDate: true,
        preferredTimeSlot: true,
        notes: true,
        quotedAmount: true,
        adminTags: true,
        details: true,
        service: { select: { nameBn: true, nameEn: true } },
        category: { select: { nameBn: true, nameEn: true } },
        area: { select: { nameBn: true, nameEn: true } },
        assignedTo: { select: { name: true } },
        formVersion: { select: { schema: true } },
      },
    });
    const areas = await db.area.findMany({ select: { id: true, nameBn: true, nameEn: true } });
    const areaNames = new Map(areas.map((area) => [area.id, pick(area, "name", locale)]));
    const slotField = commonFields({
      schemaVersion: 1,
      kind: "REQUEST",
      common: { preferredTimeSlot: "optional" },
      sections: [],
    }).find((field) => field.key === "preferredTimeSlot");

    const headers = (
      [
        "code",
        "created",
        "status",
        "priority",
        "source",
        "service",
        "category",
        "contactName",
        "contactPhone",
        "altPhone",
        "area",
        "address",
        "preferredDate",
        "timeSlot",
        "notes",
        "assignee",
        "quote",
        "tags",
        "spam",
        "guest",
        "details",
      ] as const
    ).map((key) => t(`admin.csv.${key}`));

    const csv = toCsv(
      headers,
      rows.map((row) => [
        row.code,
        formatDateTime(row.createdAt, locale),
        t(`status.request.${row.status}`),
        t(`admin.priority.${row.priority}`),
        t(`admin.source.${row.source}`),
        row.service ? pick(row.service, "name", locale) : (row.title ?? t("admin.requests.custom")),
        row.category ? pick(row.category, "name", locale) : "",
        row.contactName,
        formatBdPhoneDisplay(row.contactPhone, "en"),
        row.altPhone ? formatBdPhoneDisplay(row.altPhone, "en") : "",
        row.area ? pick(row.area, "name", locale) : "",
        row.addressLine ?? "",
        row.preferredDate ? formatDate(row.preferredDate, locale) : "",
        slotField && row.preferredTimeSlot
          ? formatValue(slotField, row.preferredTimeSlot, { locale })
          : "",
        row.notes ?? "",
        row.assignedTo?.name ?? "",
        row.quotedAmount ?? "",
        row.adminTags.join(", "),
        row.isSpam ? t("common.yes") : "",
        row.isGuest ? t("common.yes") : "",
        flattenDetails(
          (row.formVersion?.schema as FormSchema | undefined) ?? null,
          (row.details ?? {}) as Record<string, unknown>,
          locale,
          areaNames,
        ),
      ]),
    );
    // Exports contain personal data: record who took which slice.
    await audit(db, {
      action: "request.export",
      entityType: "ServiceRequest",
      entityId: "*",
      after: { filters, rows: rows.length },
    });
    const stamp = new Date().toISOString().slice(0, 10);
    return ok({ filename: `requests-${stamp}.csv`, csv, rows: rows.length });
  },
);
