import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const videoEditing = digitalTemplate(
  { key: "video_editing", name: "ভিডিও এডিটিং", description: "Video editing" },
  {
    key: "video",
    title: { bn: "ভিডিওর তথ্য", en: "Video" },
    fields: [
      {
        key: "videoType",
        type: "select",
        label: { bn: "ভিডিওর ধরন", en: "Video type" },
        summary: true,
        options: options([
          ["reel", "রিল / শর্টস", "Reel"],
          ["youtube", "ইউটিউব ভিডিও", "YouTube"],
          ["ad", "বিজ্ঞাপন", "Ad"],
          ["wedding", "বিয়ের ভিডিও", "Wedding"],
          ["corporate", "কর্পোরেট", "Corporate"],
        ]),
      },
      {
        key: "videoCount",
        type: "number",
        label: { bn: "কয়টি ভিডিও", en: "Videos" },
        validation: { min: 1, max: 200 },
        width: "half",
      },
      {
        key: "rawDuration",
        type: "text",
        label: { bn: "কাঁচা ফুটেজের দৈর্ঘ্য", en: "Raw duration" },
        placeholder: { bn: "যেমন: ২ ঘণ্টা" },
        validation: { maxLength: 40 },
        width: "half",
      },
      {
        key: "footageLink",
        type: "url",
        label: { bn: "ফুটেজের লিংক (Google Drive ইত্যাদি)", en: "Footage link" },
      },
    ],
  },
);
