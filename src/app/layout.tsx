import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";

import { env } from "@/env";

import "./globals.css";

const bangla = Noto_Sans_Bengali({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  display: "swap",
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
