"use client";

import { Camera, ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import type { MediaPurpose } from "@/generated/prisma/enums";
import { toBanglaDigits } from "@/lib/bangla";
import { cn } from "@/lib/utils";

import { compressImage } from "../compress";
import { cloudinaryUrl } from "../image-url";
import { UploadError, uploadImage, validateFileType, validateUploadSize } from "../upload-client";

export interface UploadedImage {
  id: string;
  url: string;
}

interface Pending {
  key: string;
  name: string;
  preview: string;
  progress: number;
}

const tile = "relative aspect-square overflow-hidden rounded-xl border bg-muted";

/**
 * Photo picker for forms (requests, listings, CMS): camera or gallery → compress → direct upload
 * with progress → server verification. Controlled: `value` is the ordered list of MediaAsset ids.
 */
export function ImageUploader({
  purpose,
  value,
  onChange,
  max = 5,
  label = "ছবি",
  describedBy,
}: {
  purpose: MediaPurpose;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
  label?: string;
  describedBy?: string;
}) {
  const id = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  // Uploads finish out of order; keep the latest list in a ref so none are lost.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const remaining = max - value.length - pending.length;

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const files = Array.from(list).slice(0, Math.max(remaining, 0));
    if (list.length > files.length) setError(`সর্বোচ্চ ${toBanglaDigits(max)}টি ছবি দেওয়া যাবে।`);

    await Promise.all(
      files.map(async (original) => {
        const badType = validateFileType(original);
        if (badType) {
          setError(badType);
          return;
        }
        const key = `${original.name}-${original.size}-${Math.random()}`;
        const preview = URL.createObjectURL(original);
        setPending((items) => [...items, { key, name: original.name, preview, progress: 0 }]);
        try {
          const file = await compressImage(original);
          const tooBig = validateUploadSize(file);
          if (tooBig) throw new UploadError(tooBig);
          const media = await uploadImage(file, purpose, (fraction) =>
            setPending((items) =>
              items.map((item) => (item.key === key ? { ...item, progress: fraction } : item)),
            ),
          );
          const next = [...latest.current, { id: media.id, url: media.url }];
          latest.current = next;
          onChange(next);
          setStatus(`${original.name} আপলোড হয়েছে`);
        } catch (uploadError) {
          setError(
            uploadError instanceof UploadError ? uploadError.message : "ছবি আপলোড করা যায়নি।",
          );
        } finally {
          URL.revokeObjectURL(preview);
          setPending((items) => items.filter((item) => item.key !== key));
        }
      }),
    );
  }

  const move = (index: number, delta: -1 | 1) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    onChange(next);
  };

  const inputProps = {
    type: "file" as const,
    accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
    className: "sr-only",
    tabIndex: -1,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(event.target.files);
      event.target.value = "";
    },
  };

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={describedBy}>
      <legend className="text-sm font-medium">
        {label}{" "}
        <span className="text-muted-foreground">
          ({toBanglaDigits(value.length)}/{toBanglaDigits(max)})
        </span>
      </legend>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((image, index) => (
            <li key={image.id} className={tile}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail URL */}
              <img
                src={cloudinaryUrl(image.url, { width: 240, height: 240, crop: "fill" })}
                alt={`${label} ${toBanglaDigits(index + 1)}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`${toBanglaDigits(index + 1)} নম্বর ছবি আগে নিন`}
                  className="flex size-8 items-center justify-center rounded-md text-white disabled:opacity-30"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label={`${toBanglaDigits(index + 1)} নম্বর ছবি পরে নিন`}
                  className="flex size-8 items-center justify-center rounded-md text-white disabled:opacity-30"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item.id !== image.id))}
                aria-label={`${toBanglaDigits(index + 1)} নম্বর ছবি সরান`}
                className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.key} className={tile} aria-label={`${item.name} আপলোড হচ্ছে`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={item.preview} alt="" className="size-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 text-white">
                <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  {toBanglaDigits(Math.round(item.progress * 100))}%
                </span>
              </div>
              <div
                className="absolute inset-x-0 bottom-0 h-1.5 bg-white/40"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(item.progress * 100)}
                aria-label="আপলোডের অগ্রগতি"
              >
                <div
                  className="h-full bg-cta transition-all"
                  style={{ width: `${item.progress * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div className="grid grid-cols-1 gap-2 pointer-coarse:grid-cols-2">
          {/* Camera capture only exists on touch devices; desktops (fine pointer) get one picker. */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className={cn(
              "hidden min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 px-3 font-medium text-primary hover:bg-primary-tint pointer-coarse:flex",
            )}
          >
            <Camera className="size-5" aria-hidden="true" />
            ছবি তুলুন
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 px-3 font-medium text-primary hover:bg-primary-tint"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            <span className="pointer-coarse:hidden">ছবি বেছে নিন</span>
            <span className="hidden pointer-coarse:inline">গ্যালারি থেকে</span>
          </button>
          <input
            ref={cameraRef}
            id={`${id}-camera`}
            capture="environment"
            aria-label="ক্যামেরা দিয়ে ছবি তুলুন"
            {...inputProps}
          />
          <input
            ref={galleryRef}
            id={`${id}-gallery`}
            multiple
            aria-label="গ্যালারি থেকে ছবি বেছে নিন"
            {...inputProps}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </fieldset>
  );
}
