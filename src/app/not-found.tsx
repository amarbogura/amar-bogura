import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">পেজটি খুঁজে পাওয়া যায়নি</h1>
      <p className="text-muted-foreground">আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা নেই।</p>
      <Button asChild>
        <Link href="/">হোমে ফিরে যান</Link>
      </Button>
    </main>
  );
}
