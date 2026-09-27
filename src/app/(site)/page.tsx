import { Button } from "@/components/ui/button";
import { formatTaka } from "@/lib/money";

// Placeholder until P3 builds the real homepage.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">আমার বগুড়া</h1>
      <p className="text-muted-foreground">
        বগুড়ায় কী সার্ভিস খুঁজছেন? শীঘ্রই আসছে — সার্ভিস রিকোয়েস্ট, গাড়ি ভাড়া, বাই অ্যান্ড সেল
        ও আরও অনেক কিছু।
      </p>
      <p>
        সার্ভিস শুরু <span className="font-semibold text-primary">{formatTaka(1200)}</span> থেকে
      </p>
      <div className="flex flex-wrap gap-3">
        <Button>রিকোয়েস্ট করুন</Button>
        <Button className="bg-emergency text-emergency-foreground hover:bg-emergency/90">
          জরুরি অ্যাম্বুলেন্স
        </Button>
      </div>
    </main>
  );
}
