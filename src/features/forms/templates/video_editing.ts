import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const videoEditing = digitalTemplate(
  { key: "video_editing", name: "ভিডিও এডিটিং", description: "Video editing" },
  {
    key: "video",
    title: { bn: "ভিডিওর তথ্য", en: "Video details" },
    fields: [
      {
        key: "videoType",
        type: "select",
        label: { bn: "ভিডিওর ধরন", en: "Type of video" },
        summary: true,
        options: options([
          ["reel", "রিল / শর্টস", "Reels / shorts"],
          ["youtube", "ইউটিউব ভিডিও", "YouTube video"],
          ["ad", "বিজ্ঞাপন", "Advertisement"],
          ["wedding", "বিয়ের ভিডিও", "Wedding video"],
          ["corporate", "কর্পোরেট", "Corporate"],
        ]),
      },
      {
        key: "videoCount",
        type: "number",
        label: { bn: "কয়টি ভিডিও", en: "How many videos?" },
        validation: { min: 1, max: 200 },
        width: "half",
      },
      {
        key: "rawDuration",
        type: "text",
        label: { bn: "কাঁচা ফুটেজের দৈর্ঘ্য", en: "Length of raw footage" },
        placeholder: { bn: "যেমন: ২ ঘণ্টা", en: "e.g. 2 hours" },
        validation: { maxLength: 40 },
        width: "half",
      },
      {
        key: "footageLink",
        type: "url",
        label: {
          bn: "ফুটেজের লিংক (Google Drive ইত্যাদি)",
          en: "Footage link (Google Drive etc.)",
        },
      },
    ],
  },
);
