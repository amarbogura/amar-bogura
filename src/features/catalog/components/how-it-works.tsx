import { ClipboardPen, PhoneCall, Wrench } from "lucide-react";

import { SectionHeader } from "@/components/section-header";

const STEPS = [
  {
    icon: ClipboardPen,
    title: "রিকোয়েস্ট করুন",
    text: "ছোট একটি ফর্মে কী দরকার জানান — লগইন ছাড়াই।",
  },
  { icon: PhoneCall, title: "আমরা ফোন করব", text: "আমাদের টিম বিস্তারিত জেনে খরচ ও সময় জানাবে।" },
  {
    icon: Wrench,
    title: "কাজ সম্পন্ন",
    text: "নির্ধারিত সময়ে কাজ হবে; অবস্থা অ্যাকাউন্ট থেকে দেখতে পারবেন।",
  },
];

/** Same three steps for every service (the schema has no per-service "what's included" yet). */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title">
      <SectionHeader id="how-title" title="কীভাবে কাজ করে" />
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <step.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold">
                <span className="sr-only">ধাপ {index + 1}: </span>
                {step.title}
              </span>
              <span className="text-sm text-muted-foreground">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
