import { MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PriceTag } from "@/components/price-tag";
import { StatusBadge } from "@/components/status-badge";
import { getAreaGroups } from "@/features/account/queries";
import { BlockPhoneButton, RequestActions } from "@/features/admin/components/request-actions";
import { getAdminRequest, listAssignableAdmins } from "@/features/admin/requests/queries";
import { allowedNext, requiresMessage } from "@/features/admin/requests/transitions";
import { commonFields } from "@/features/forms/common-fields";
import { DetailsView } from "@/features/forms/components/details-view";
import { areaNameMap } from "@/features/forms/components/render-context";
import { cloudinaryUrl } from "@/features/media/image-url";
import { normalizeRequestCode } from "@/features/requests/code";
import { isLocale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { formatDateTime } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { getT, resolveLocale, type T } from "@/i18n/server";
import { telHref, whatsappHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { requireAdminPage } from "@/lib/session";
import { dhakaYmd } from "@/lib/time";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/requests/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: decodeURIComponent(code) };
}

/** `YYYY-MM-DD` of the Dhaka calendar day (dates are stored at Dhaka midnight). */
function dhakaDateKey(date: Date): string {
  const { year, month, day } = dhakaYmd(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Event = NonNullable<Awaited<ReturnType<typeof getAdminRequest>>>["events"][number];

function eventTitle(event: Event, t: T): string {
  switch (event.type) {
    case "CREATED":
      return t("requests.events.created");
    case "STATUS_CHANGE":
      return event.toStatus
        ? t("requests.events.status", { status: t(`status.request.${event.toStatus}`) })
        : t("requests.events.statusChanged");
    case "QUOTE":
      return t("requests.events.quote");
    case "ASSIGNMENT":
      return event.message
        ? t("admin.request.assignedTo", { name: event.message })
        : `${t("admin.request.assign")}: ${t("admin.request.unassign")}`;
    case "NOTE":
      return t("requests.events.note");
  }
}

export default async function AdminRequestPage({
  params,
}: PageProps<"/[locale]/admin/requests/[code]">) {
  const [locale, { code: rawCode }] = await Promise.all([resolveLocale(params), params]);
  const t = getT(locale);
  const { user } = await requireAdminPage("requests.manage", locale);
  const code = normalizeRequestCode(decodeURIComponent(rawCode));
  const request = code ? await getAdminRequest(code) : null;
  if (!request) notFound();
  const [areaGroups, admins] = await Promise.all([getAreaGroups(locale), listAssignableAdmins()]);
  const next = [...allowedNext(request.status, "admin")];
  const title = request.service
    ? pick(request.service, "name", locale)
    : (request.title ?? t("admin.requests.custom"));
  const customerLocale = isLocale(request.locale) ? request.locale : "bn";

  const phones = [
    { label: t("admin.request.contact"), phone: request.contactPhone },
    ...(request.altPhone ? [{ label: t("admin.request.altPhone"), phone: request.altPhone }] : []),
  ];

  return (
    <>
      <Link href="/admin/requests" className="text-sm text-primary underline">
        {t("admin.request.back")}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="request" status={request.status} />
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              request.priority === "EMERGENCY"
                ? "bg-emergency text-emergency-foreground"
                : "bg-muted",
            )}
          >
            {t(`admin.priority.${request.priority}`)}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
            {t(`admin.source.${request.source}`)}
          </span>
          {request.isSpam && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive">
              {t("admin.requests.spam")}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{request.code}</span> ·{" "}
          {formatDateTime(request.createdAt, locale)} ·{" "}
          {t("admin.request.customerLanguage", {
            language: t(`admin.languages.${customerLocale}`),
          })}
        </p>
        {request.assignedTo && (
          <p className="text-sm">
            {t("admin.request.assignedTo", { name: request.assignedTo.name })}
          </p>
        )}
        {request.quotedAmount != null && (
          <p className="text-sm">
            {t("requests.detail.estimate")} <PriceTag amount={request.quotedAmount} />
          </p>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-4">
          <section
            aria-labelledby="contact-title"
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <h2 id="contact-title" className="font-semibold">
              {t("admin.request.contact")}
            </h2>
            <p className="font-medium">
              {request.contactName}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ·{" "}
                {request.user ? (
                  <Link href={`/admin/users/${request.user.id}`} className="underline">
                    {t("admin.request.registeredUser")}
                  </Link>
                ) : (
                  t("admin.request.guest")
                )}
              </span>
            </p>
            {phones.map(({ label, phone }) => (
              <div key={phone} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{label}:</span>
                <span className="font-mono">{formatBdPhoneDisplay(phone, locale)}</span>
                {telHref(phone) && (
                  <a
                    href={telHref(phone)!}
                    className="inline-flex tap items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {t("admin.request.call")}
                  </a>
                )}
                {whatsappHref(phone, request.code) && (
                  <a
                    href={whatsappHref(phone, request.code)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex tap items-center gap-1 rounded-md border px-3 text-sm font-medium"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {t("admin.request.whatsapp")}
                  </a>
                )}
              </div>
            ))}
            <BlockPhoneButton phone={request.contactPhone} blocked={request.phoneBlocked} />
          </section>

          <section aria-labelledby="details-title" className="flex flex-col gap-3">
            <h2 id="details-title" className="font-semibold">
              {t("admin.request.details")}
            </h2>
            {request.schema ? (
              <DetailsView
                schema={request.schema}
                details={(request.details ?? {}) as Record<string, unknown>}
                extraFields={commonFields(request.schema).filter((field) => field.key !== "photos")}
                extraValues={{
                  title: request.title ?? undefined,
                  contactName: request.contactName,
                  contactPhone: request.contactPhone,
                  altPhone: request.altPhone ?? undefined,
                  areaId: request.areaId ?? undefined,
                  addressLine: request.addressLine ?? undefined,
                  preferredDate: request.preferredDate
                    ? dhakaDateKey(request.preferredDate)
                    : undefined,
                  preferredTimeSlot: request.preferredTimeSlot ?? undefined,
                  notes: request.notes ?? undefined,
                }}
                areaNames={areaNameMap(areaGroups)}
                locale={locale}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("requests.detail.noDetails")}</p>
            )}
            {request.attachments.length > 0 && (
              <ul
                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                aria-label={t("requests.detail.photos")}
              >
                {request.attachments.map(({ media }) => (
                  <li key={media.id}>
                    <a
                      href={cloudinaryUrl(media.url, { width: 1600 })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL already optimized */}
                      <img
                        src={cloudinaryUrl(media.url, { width: 300, height: 300, crop: "fill" })}
                        alt={t("media.attached")}
                        loading="lazy"
                        className="aspect-square w-full rounded-lg border object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <RequestActions
            code={request.code}
            allowedNext={next}
            needsMessage={next.filter((status) => requiresMessage(status, "admin"))}
            assigneeId={request.assignedTo?.id ?? null}
            admins={admins}
            meId={user.id}
            quotedAmount={request.quotedAmount}
            tags={request.adminTags}
            isSpam={request.isSpam}
          />

          <section
            aria-labelledby="timeline-title"
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <h2 id="timeline-title" className="font-semibold">
              {t("admin.request.timeline")}
            </h2>
            <ol className="flex flex-col gap-3">
              {request.events.map((event) => (
                <li
                  key={event.id}
                  className={cn(
                    "border-l-2 pl-3",
                    event.visibleToUser
                      ? "border-primary"
                      : "border-dashed border-muted-foreground",
                  )}
                >
                  <p className="text-sm font-medium">
                    {eventTitle(event, t)}
                    {!event.visibleToUser && (
                      <span className="ml-2 rounded bg-muted px-1.5 text-xs text-muted-foreground">
                        {t("admin.request.internal")}
                      </span>
                    )}
                  </p>
                  {event.message && event.type !== "ASSIGNMENT" && (
                    <p className="text-sm whitespace-pre-line">{event.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt, locale)}
                    {event.actor && ` ${t("admin.request.by", { name: event.actor.name })}`}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
