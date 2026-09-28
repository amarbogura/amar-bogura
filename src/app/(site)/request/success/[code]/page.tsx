import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/skeletons";
import { normalizeRequestCode } from "@/features/requests/code";
import { CopyCode } from "@/features/requests/components/copy-code";
import { getSiteSettings } from "@/features/site/queries";
import { telHref, whatsappHref } from "@/lib/contact-links";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "রিকোয়েস্ট জমা হয়েছে",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  "আমাদের টিম আপনার রিকোয়েস্টটি যাচাই করবে।",
  "সাধারণত কিছুক্ষণের মধ্যেই আপনাকে ফোন করে বিস্তারিত ও খরচ জানানো হবে।",
  "আপনি রাজি হলে কাজ শুরু হবে — কোনো অগ্রিম টাকা লাগে না।",
];

/** Shows only the code (no personal data), so opening it by URL reveals nothing. */
async function Success({ params }: { params: PageProps<"/request/success/[code]">["params"] }) {
  const code = normalizeRequestCode(decodeURIComponent((await params).code));
  if (!code) notFound();
  const settings = await getSiteSettings();
  const hotline = telHref(settings.hotline);
  const whatsapp = whatsappHref(settings.whatsapp, `আমার রিকোয়েস্ট কোড: ${code}`);

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">রিকোয়েস্ট জমা হয়েছে!</h1>
        <p className="text-muted-foreground">এই কোডটি রেখে দিন — ট্র্যাক করতে লাগবে।</p>
        <CopyCode code={code} />
      </div>

      <section
        aria-labelledby="next-title"
        className="flex flex-col gap-2 rounded-2xl border bg-card p-4"
      >
        <h2 id="next-title" className="font-semibold">
          এরপর কী হবে
        </h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {hotline && (
          <a
            href={hotline}
            className="flex tap items-center justify-center gap-2 rounded-xl border px-4 font-medium hover:bg-muted"
          >
            <Phone className="size-5" aria-hidden="true" />
            হটলাইন {formatBdPhoneDisplay(settings.hotline!)}
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex tap items-center justify-center gap-2 rounded-xl border px-4 font-medium hover:bg-muted"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            WhatsApp-এ কোড পাঠান
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link href={routes.trackRequest(code)} className="font-semibold text-primary underline">
          রিকোয়েস্টের অবস্থা দেখুন
        </Link>
        <p className="text-muted-foreground">
          লগইন করা থাকলে বা একই নম্বর দিয়ে লগইন করলে{" "}
          <Link href={routes.myRequests} className="underline">
            আমার রিকোয়েস্ট
          </Link>
          -এ সব রিকোয়েস্ট দেখতে পাবেন।
        </p>
        <Link href={routes.home} className="underline">
          হোমে ফিরে যান
        </Link>
      </div>
    </>
  );
}

export default function RequestSuccessPage({ params }: PageProps<"/request/success/[code]">) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Success params={params} />
      </Suspense>
    </div>
  );
}
