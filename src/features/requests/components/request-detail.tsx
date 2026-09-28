import { CheckCircle2, Circle } from "lucide-react";

import { PriceTag } from "@/components/price-tag";
import { StatusBadge } from "@/components/status-badge";
import type { AreaGroup } from "@/features/account/queries";
import { commonFields } from "@/features/forms/common-fields";
import { DetailsView } from "@/features/forms/components/details-view";
import { areaNameMap } from "@/features/forms/components/render-context";
import { cloudinaryUrl } from "@/features/media/image-url";
import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/content";
import { formatDateTime } from "@/i18n/format";
import { getT, type T } from "@/i18n/server";

import type { RequestDetailData } from "../queries";
import { canCancel } from "../status";
import { CancelRequestButton } from "./cancel-button";

type Event = RequestDetailData["events"][number];

function eventText(event: Event, t: T): string {
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
      return t("requests.events.assignment");
    case "NOTE":
      return t("requests.events.note");
  }
}

/** Read-only request view for its owner (`/account/requests/[code]`) or a verified `/track` visitor. */
export function RequestDetail({
  request,
  areaGroups,
  locale,
}: {
  request: RequestDetailData;
  areaGroups: AreaGroup[];
  locale: Locale;
}) {
  const t = getT(locale);
  const title = request.service
    ? pick(request.service, "name", locale)
    : (request.title ?? t("requests.custom.title"));
  const photos = request.attachments;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="request" status={request.status} />
          {request.priority === "EMERGENCY" && (
            <span className="rounded-full bg-emergency px-2.5 py-0.5 text-xs font-semibold text-emergency-foreground">
              {t("requests.detail.emergency")}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("requests.detail.code")}{" "}
          <span className="font-mono font-semibold text-foreground">{request.code}</span> ·{" "}
          {formatDateTime(request.createdAt, locale)}
        </p>
        {request.quotedAmount != null && (
          <p className="text-sm">
            {t("requests.detail.estimate")} <PriceTag amount={request.quotedAmount} />
          </p>
        )}
      </header>

      <section aria-labelledby="timeline-title" className="flex flex-col gap-3">
        <h2 id="timeline-title" className="text-lg font-semibold">
          {t("requests.detail.progress")}
        </h2>
        <ol className="flex flex-col gap-3">
          {request.events.map((event, index) => {
            const latest = index === request.events.length - 1;
            const Marker = latest ? CheckCircle2 : Circle;
            return (
              <li key={event.id} className="flex gap-3">
                <Marker
                  className={
                    latest ? "mt-0.5 size-5 text-primary" : "mt-0.5 size-5 text-muted-foreground"
                  }
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{eventText(event, t)}</span>
                  {event.message && <span className="text-sm">{event.message}</span>}
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt, locale)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="details-title" className="flex flex-col gap-3">
        <h2 id="details-title" className="text-lg font-semibold">
          {t("requests.detail.yourInfo")}
        </h2>
        {request.schema ? (
          <DetailsView
            schema={request.schema}
            details={request.details}
            extraFields={commonFields(request.schema).filter((field) => field.key !== "photos")}
            extraValues={request.commonValues}
            areaNames={areaNameMap(areaGroups)}
            locale={locale}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("requests.detail.noDetails")}</p>
        )}
        {photos.length > 0 && (
          <ul
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            aria-label={t("requests.detail.photos")}
          >
            {photos.map(({ media }) => (
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

      {canCancel(request.status) && <CancelRequestButton code={request.code} />}
    </div>
  );
}
