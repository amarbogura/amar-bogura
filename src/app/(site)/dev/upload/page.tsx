import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UploadPlayground } from "@/features/media/components/upload-playground";

export const metadata: Metadata = { title: "Upload test", robots: { index: false, follow: false } };

/** Development-only page to test the uploader on a phone (never served in production). */
export default function DevUploadPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-bold">ছবি আপলোড পরীক্ষা</h1>
      <UploadPlayground />
    </div>
  );
}
