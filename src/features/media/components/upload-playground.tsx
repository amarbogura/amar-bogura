"use client";

import { useState } from "react";

import { useT } from "@/i18n/client";

import { ImageUploader, type UploadedImage } from "./image-uploader";

/** Dev-only harness for /dev/upload: one REQUEST uploader (guests allowed) and one LISTING. */
export function UploadPlayground() {
  const t = useT();
  const [request, setRequest] = useState<UploadedImage[]>([]);
  const [listing, setListing] = useState<UploadedImage[]>([]);
  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("media.playgroundRequest")}</h2>
        <ImageUploader purpose="REQUEST" value={request} onChange={setRequest} max={5} />
        <output data-testid="request-ids" className="text-xs break-all text-muted-foreground">
          {request.map((image) => image.id).join(",")}
        </output>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("media.playgroundListing")}</h2>
        <ImageUploader purpose="LISTING" value={listing} onChange={setListing} max={8} />
      </section>
    </>
  );
}
