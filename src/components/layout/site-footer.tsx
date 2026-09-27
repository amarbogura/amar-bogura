import Link from "next/link";

import { CallButton } from "@/components/contact-buttons";
import { formatBdPhoneDisplay } from "@/lib/phone";
import { routes } from "@/lib/routes";

const LINKS = [
  { href: routes.page("about"), label: "আমাদের সম্পর্কে" },
  { href: routes.page("contact"), label: "যোগাযোগ" },
  { href: routes.page("help"), label: "সাহায্য" },
  { href: routes.page("terms"), label: "শর্তাবলি" },
  { href: routes.page("privacy"), label: "গোপনীয়তা নীতি" },
  { href: routes.page("report"), label: "সমস্যা জানান" },
];

export function SiteFooter({ hotline }: { hotline: string | null }) {
  return (
    <footer className="mt-12 bg-navy text-navy-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <p className="text-lg font-bold">আমার বগুড়া</p>
          <p className="text-sm text-white/80">
            বগুড়ার সব সার্ভিস, কেনাবেচা ও প্রপার্টি — এক জায়গায়।
          </p>
          {hotline && (
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-sm text-white/80">হটলাইন: {formatBdPhoneDisplay(hotline)}</p>
              <CallButton phone={hotline} label="হটলাইনে কল করুন" className="self-start" />
            </div>
          )}
        </div>
        <nav aria-label="ফুটার মেনু">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex tap items-center text-sm text-white/90 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/70">
        © আমার বগুড়া · বগুড়া, বাংলাদেশ
      </p>
    </footer>
  );
}
