import { defineTemplate, EVENT_BUDGET_OPTIONS, EVENT_TYPE_OPTIONS, options } from "./_helpers";

/** Wedding/event photography & videography; `mediaType` pinned per service. */
export const eventMedia = defineTemplate({
  key: "event_media",
  name: "ফটোগ্রাফি ও ভিডিওগ্রাফি",
  kind: "REQUEST",
  description: "Event photography / videography (mediaType pinned per service)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "hidden",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    sections: [
      {
        key: "event",
        title: { bn: "অনুষ্ঠানের তথ্য", en: "Event" },
        fields: [
          {
            key: "mediaType",
            type: "select",
            label: { bn: "কী লাগবে", en: "Coverage" },
            required: true,
            summary: true,
            options: options([
              ["photography", "ফটোগ্রাফি", "Photography"],
              ["videography", "ভিডিওগ্রাফি", "Videography"],
              ["both", "ফটো ও ভিডিও দুটোই", "Both"],
            ]),
          },
          {
            key: "eventType",
            type: "select",
            label: { bn: "অনুষ্ঠানের ধরন", en: "Event type" },
            required: true,
            summary: true,
            options: EVENT_TYPE_OPTIONS,
          },
          {
            key: "eventDate",
            type: "date",
            label: { bn: "অনুষ্ঠানের তারিখ", en: "Event date" },
            required: true,
            summary: true,
          },
          {
            key: "venue",
            type: "address",
            label: { bn: "অনুষ্ঠানের স্থান", en: "Venue" },
            required: true,
          },
          {
            key: "days",
            type: "number",
            label: { bn: "কত দিনের অনুষ্ঠান", en: "Days" },
            required: true,
            defaultValue: 1,
            validation: { min: 1, max: 10 },
            width: "half",
          },
          {
            key: "hoursPerDay",
            type: "number",
            label: { bn: "প্রতিদিন কত ঘণ্টা", en: "Hours per day" },
            validation: { min: 1, max: 16 },
            width: "half",
          },
          {
            key: "side",
            type: "radio",
            label: { bn: "কোন পক্ষ", en: "Side" },
            options: options([
              ["bride", "কনে পক্ষ", "Bride"],
              ["groom", "বর পক্ষ", "Groom"],
              ["both", "উভয় পক্ষ", "Both"],
            ]),
          },
        ],
      },
      {
        key: "package",
        title: { bn: "প্যাকেজ ও বাজেট", en: "Package & budget" },
        fields: [
          {
            key: "deliverables",
            type: "checkboxes",
            label: { bn: "কী কী চান", en: "Deliverables" },
            options: options([
              ["edited_photos", "এডিট করা ছবি", "Edited photos"],
              ["printed_album", "প্রিন্টেড অ্যালবাম", "Printed album"],
              ["cinematic_video", "সিনেমাটিক ভিডিও", "Cinematic video"],
              ["full_video", "পূর্ণ ভিডিও", "Full video"],
              ["drone", "ড্রোন শট", "Drone"],
              ["same_day_edit", "একই দিনে এডিট", "Same-day edit"],
            ]),
          },
          {
            key: "budgetRange",
            type: "select",
            label: { bn: "বাজেট", en: "Budget" },
            required: true,
            summary: true,
            options: EVENT_BUDGET_OPTIONS,
          },
          {
            key: "referenceLinks",
            type: "url",
            label: { bn: "পছন্দের কাজের লিংক", en: "Reference link" },
            placeholder: { bn: "ফেসবুক / ইউটিউব লিংক" },
          },
        ],
      },
    ],
  },
});
