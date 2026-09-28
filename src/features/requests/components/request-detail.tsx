import { CheckCircle2, Circle } from "lucide-react";

import { PriceTag } from "@/components/price-tag";
import { REQUEST_STATUS, StatusBadge } from "@/components/status-badge";
import type { AreaGroup } from "@/features/account/queries";
import { commonFields } from "@/features/forms/common-fields";
import { DetailsView } from "@/features/forms/components/details-view";
import { areaNameMap } from "@/features/forms/components/render-context";
import { cloudinaryUrl } from "@/features/media/image-url";
import { formatDhakaDateTime } from "@/lib/time";

import type { RequestDetailData } from "../queries";
import { canCancel } from "../status";
import { CancelRequestButton } from "./cancel-button";

type Event = RequestDetailData["events"][number];

function eventText(event: Event): string {
  switch (event.type) {
    case "CREATED":
      return "রিকোয়েস্ট জমা হয়েছে";
    case "STATUS_CHANGE":
      return event.toStatus
        ? `স্ট্যাটাস: ${REQUEST_STATUS[event.toStatus].label}`
        : "স্ট্যাটাস বদলেছে";
    case "QUOTE":
      return "খরচ জানানো হয়েছে";
    case "ASSIGNMENT":
      return "দায়িত্বপ্রাপ্ত কর্মী ঠিক করা হয়েছে";
    case "NOTE":
      return "আমাদের টিমের বার্তা";
  }
}

/** Read-only request view for its owner (`/account/requests/[code]`) or a verified `/track` visitor. */
export function RequestDetail({
  request,
  areaGroups,
}: {
  request: RequestDetailData;
  areaGroups: AreaGroup[];
}) {
  const title = request.service?.nameBn ?? request.title ?? "কাস্টম রিকোয়েস্ট";
  const photos = request.attachments;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="request" status={request.status} />
          {request.priority === "EMERGENCY" && (
            <span className="rounded-full bg-emergency px-2.5 py-0.5 text-xs font-semibold text-emergency-foreground">
              জরুরি
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          কোড: <span className="font-mono font-semibold text-foreground">{request.code}</span> ·{" "}
          {formatDhakaDateTime(request.createdAt)}
        </p>
        {request.quotedAmount != null && (
          <p className="text-sm">
            আনুমানিক খরচ: <PriceTag amount={request.quotedAmount} />
          </p>
        )}
      </header>

      <section aria-labelledby="timeline-title" className="flex flex-col gap-3">
        <h2 id="timeline-title" className="text-lg font-semibold">
          অগ্রগতি
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
                  <span className="font-medium">{eventText(event)}</span>
                  {event.message && <span className="text-sm">{event.message}</span>}
                  <span className="text-xs text-muted-foreground">
                    {formatDhakaDateTime(event.createdAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="details-title" className="flex flex-col gap-3">
        <h2 id="details-title" className="text-lg font-semibold">
          আপনার দেওয়া তথ্য
        </h2>
        {request.schema ? (
          <DetailsView
            schema={request.schema}
            details={request.details}
            extraFields={commonFields(request.schema).filter((field) => field.key !== "photos")}
            extraValues={request.commonValues}
            areaNames={areaNameMap(areaGroups)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">বিস্তারিত তথ্য পাওয়া যায়নি।</p>
        )}
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="ছবি">
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
                    alt="সংযুক্ত ছবি"
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
