import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";

import { env } from "@/env";

import "./globals.css";

const bangla = Noto_Sans_Bengali({
  variable: "--font-bangla",
  // Bengali only: the little Latin text ("Buy & Sell", "ProTutors") uses the system font.
  subsets: ["bengali"],
  // "optional": no late swap repaint (it was the LCP on 4G). Android ships Noto Sans Bengali as its
  // system Bangla font, so the fallback is visually the same for most users.
  display: "optional",
  // Not preloaded: keeps the 106 KB font off the critical path. First visits on slow networks use the
  // system Bangla font; the file is cached in the background for every later page.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "আমার বগুড়া — বগুড়ার সব সার্ভিস এক জায়গায়",
    template: "%s | আমার বগুড়া",
  },
  description:
    "বগুড়ার হোম সার্ভিস, গাড়ি ভাড়া, কুরিয়ার, বাজার, প্রপার্টি, বাই অ্যান্ড সেল — এক অ্যাপে রিকোয়েস্ট করুন।",
  applicationName: "আমার বগুড়া",
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${bangla.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
